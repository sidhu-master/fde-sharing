import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleTool, ToolName } from "@/lib/tools/tools-handling";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import useConversationStore from "@/stores/useConversationStore";
import { processMessages } from "@/lib/assistant";
import { parameterLabels } from "@/lib/ui-labels";
export default function Action({
  name,
  functionName,
  parameters,
}: {
  name: string;
  functionName: ToolName;
  parameters: Record<string, any>;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const addConversationItem = useConversationStore(
    (s) => s.addConversationItem
  );
  const removeRecommendedAction = useConversationStore(
    (s) => s.removeRecommendedAction
  );
  const handleConfirm = async () => {
    setLoading(true);
    const result = await handleTool(functionName, parameters, "execute");
    if (result.result) {
      console.log("Executed function", functionName, parameters, result);
      // Add to conversation as a new assistant message
      addConversationItem({
        role: "user",
        content: `客服代表已人工批准 ${functionName}，模拟执行结果：${JSON.stringify(result)}。请仅复述返回结果，明确这是演示中的模拟执行，不要再次发起同一操作，不得添加未返回的退款状态、金额、到账时间或其他承诺。`,
      });
      await processMessages();
    } else {
      console.log("Error executing function", functionName, parameters, result);
    }
    setLoading(false);
    // Close dialog and remove suggested action
    setOpen(false);
    removeRecommendedAction(functionName);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="bg-black hover:bg-zinc-800 text-white px-3 py-1.5 text-sm rounded-lg cursor-pointer">
          {name}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>
            请确认要执行的操作，以处理客户请求
          </DialogDescription>
          <DialogDescription>{functionName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {Object.entries(parameters).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <Label htmlFor={key} className="w-24">
                {parameterLabels[key] || key}
              </Label>
              <Input id={key} defaultValue={value} className="col-span-3" />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => handleConfirm()}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "确认执行"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
