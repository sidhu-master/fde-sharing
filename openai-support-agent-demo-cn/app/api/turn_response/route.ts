import { companyTurn } from "@/lib/company-adapter";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !new Set(["http://127.0.0.1:3200", "http://localhost:3200"]).has(origin)) return NextResponse.json({ error: "ORIGIN_DENIED" }, { status: 403 });
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 96000) return NextResponse.json({ error: "INPUT_TOO_LARGE" }, { status: 413 });
    const { messages } = JSON.parse(raw);
    const events = await companyTurn(messages);

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify(event);
            controller.enqueue(`data: ${data}\n\n`);
          }
          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("company adapter:", error instanceof Error ? error.message : "REQUEST_FAILED");
    return NextResponse.json(
      {
        error: "COMPANY_MODEL_REQUEST_FAILED",
      },
      { status: 500 }
    );
  }
}
