"""Local demo adapter. Company credentials remain on the existing SSH server."""
import asyncio
import base64
import json
import os
import re
import httpx2 as httpx
from openai import AsyncOpenAI
from agents import OpenAIChatCompletionsModel, set_tracing_disabled

REMOTE = r'''(async()=>{
const fs=require('node:fs'),body=JSON.parse(fs.readFileSync(0,'utf8'));
body.model=process.env.COMPANY_AI_MODEL_NAME;body.stream=false;
delete body.stream_options;body.thinking={type:'disabled'};
const r=await fetch(process.env.COMPANY_AI_BASE_URL.replace(/\/$/,'')+'/chat/completions',{
method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+process.env.COMPANY_AI_API_KEY},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
if(!r.ok)throw Error('MODEL_HTTP_'+r.status);
process.stdout.write(JSON.stringify(await r.json()));
})().catch(()=>{process.stdout.write(JSON.stringify({error:'COMPANY_MODEL_FAILED'}));process.exitCode=1});'''

class CompanyTransport(httpx.AsyncBaseTransport):
    async def handle_async_request(self, request):
        if request.url.path != '/chat/completions':
            return httpx.Response(404, json={'error': 'unsupported endpoint'})
        body = json.loads(await request.aread())
        # Language preference only; leave original instructions, tools and policies intact.
        body['messages'].insert(0, {'role': 'system', 'content': '面向用户的自然语言回复请使用简体中文。保留所有工具名称、参数标识和 JSON 结构，不改变业务规则。'})
        streaming = body.get('stream', False)
        code = base64.b64encode(REMOTE.encode()).decode()
        target = os.environ.get('COMPANY_AI_SSH_TARGET', '')
        env_file = os.environ.get('COMPANY_AI_REMOTE_ENV_FILE', '')
        if not re.fullmatch(r'[a-zA-Z0-9_.@-]+', target) or target.startswith('-') or not re.fullmatch(r'/[a-zA-Z0-9_./-]+', env_file):
            raise RuntimeError('CONFIGURATION_MISSING')
        command = f'''set -a; . {env_file}; set +a; node -e 'eval(Buffer.from("{code}","base64").toString())' '''
        process = await asyncio.create_subprocess_exec(
            'ssh', '-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
            target, command,
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL)
        try:
            output, _ = await asyncio.wait_for(process.communicate(json.dumps(body).encode()), 100)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            process.kill()
            await process.wait()
            raise
        if process.returncode:
            return httpx.Response(502, json={'error': {'message': 'Company model unavailable', 'type': 'upstream_error'}})
        result = json.loads(output)
        if not streaming:
            return httpx.Response(200, json=result)
        # Preserve SDK event handling, but upstream is buffered (not token streaming).
        events = []
        for choice in result['choices']:
            delta = choice['message']
            for index, call in enumerate(delta.get('tool_calls') or []):
                call['index'] = index
            events.append({'id': result['id'], 'object': 'chat.completion.chunk',
                'created': result.get('created', 0), 'model': result['model'],
                'choices': [{'index': choice['index'], 'delta': delta, 'finish_reason': None}]})
            events.append({'id': result['id'], 'object': 'chat.completion.chunk',
                'created': result.get('created', 0), 'model': result['model'],
                'choices': [{'index': choice['index'], 'delta': {}, 'finish_reason': choice['finish_reason']}]})
        content = ''.join('data: '+json.dumps(event)+'\n\n' for event in events)+'data: [DONE]\n\n'
        return httpx.Response(200, content=content.encode(), headers={'content-type': 'text/event-stream'})

set_tracing_disabled(True)
if os.environ.get('COMPANY_AI_BASE_URL'):
    if not os.environ.get('COMPANY_AI_API_KEY') or not os.environ.get('COMPANY_AI_MODEL_NAME'):
        raise RuntimeError('CONFIGURATION_MISSING')
    client = AsyncOpenAI(api_key=os.environ['COMPANY_AI_API_KEY'],
        base_url=os.environ['COMPANY_AI_BASE_URL'], max_retries=0, timeout=110)
else:
    client = AsyncOpenAI(api_key='local-transport-no-secret', base_url='http://company.local',
        max_retries=0, http_client=httpx.AsyncClient(transport=CompanyTransport(), timeout=110))
MODEL = OpenAIChatCompletionsModel(model=os.environ.get('COMPANY_AI_MODEL_NAME', 'company-model'), openai_client=client)
