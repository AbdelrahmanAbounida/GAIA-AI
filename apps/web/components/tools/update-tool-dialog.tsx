import { Tool } from "@gaia/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useState } from "react";
import { useTools } from "@/hooks/use-tools";
import { Button } from "../ui/button";
import { Loader2Icon, Pencil } from "lucide-react";
import { TypeScriptEditor } from "./code-editor";

interface EditToolDialogProps {
  tool: Partial<Tool>;
  open?: boolean;
  children?: React.ReactNode;
}

export const EditToolDialog = ({ tool, ...props }: EditToolDialogProps) => {
  const [open, setOpen] = useState(props?.open || false);
  const { updateTool } = useTools({
    showToasts: true,
  });

  const [formData, setFormData] = useState({
    name: tool.name,
    description: tool.description || "",
    code: tool.code,
  });

  // Reset form data when dialog opens or tool changes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setFormData({
        name: tool.name,
        description: tool.description || "",
        code: tool.code,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateTool.mutate(
      {
        toolId: tool.id,
        tool: {
          name: formData.name?.trim(),
          description: formData.description.trim(),
          code: formData.code?.trim(),
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  const isLoading = updateTool.isPending;
  const isFormValid = formData.name?.trim()?.length! > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {props.children ?? (
          <Button
            variant="outline"
            className="w-full flex items-center justify-start p-0 pl-2 h-7 border-none"
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            <Pencil className="mr-2 size-3.5!" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[90vw]! max-w-3xl! h-[90vh]! max-h-[700px]  p-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Custom Tool</DialogTitle>
          <DialogDescription>
            Create a custom tool that can be used by your RAG agents
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Tool Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="my_custom_tool"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What does this tool do?"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <Label>Tool Code (Typescript)</Label>
            <TypeScriptEditor
              className="flex-1 bg-gaia-200 dark:bg-gaia-950"
              code={formData.code!}
              onChange={(value) =>
                setFormData({ ...formData, code: value || "" })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Creating..." : "Update Tool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
