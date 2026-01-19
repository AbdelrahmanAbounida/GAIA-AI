import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  ExternalLink,
  Loader2,
  PlusIcon,
  SquareArrowOutUpRightIcon,
  SquareArrowUpRightIcon,
  Wand2,
} from "lucide-react";
import { useTools } from "@/hooks/use-tools";
import { TypeScriptEditor } from "./code-editor";
import { showErrorToast } from "../ui/toast";
import Image from "next/image";

const generateChatGPTPrompt = ({ toolConfig }: { toolConfig: any }) => {
  const prompt = `Create a TypeScript tool function for the following use case:

**Tool Name:** ${toolConfig.name || "my_tool"}
**Description:** ${toolConfig.description || "No description provided"}
**Use Case:** ${toolConfig.useCase || "Not specified"}
${toolConfig.requiresApiKey ? `**Requires API Integration:** Yes (${toolConfig.apiKeyName})` : ""}
${toolConfig.dependencies ? `**Dependencies:** ${toolConfig.dependencies}` : ""}

Requirements:
1. Export an async function called "execute" that takes a params object
2. Use TypeScript types for params
3. Handle errors gracefully with try-catch
4. Return a structured result object
5. Add comments explaining key steps
${toolConfig.requiresApiKey ? "6. Accept API key as a parameter and show how to use it" : ""}

Please provide ONLY the TypeScript code, no explanations or markdown formatting.`;

  return encodeURIComponent(prompt);
};

export const NewToolDialog = ({
  forceShow = false,
}: {
  forceShow?: boolean;
}) => {
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const { isLoadingTools, tools, createTool, projectId } = useTools({
    showToasts: true,
  });
  const [newTool, setNewTool] = useState({
    name: "",
    description: "",
    code: "",
  });

  const handleAddTool = async () => {
    if (!newTool.name) {
      showErrorToast({
        title: "Missing Tool Name",
        position: "bottom-right",
        description: "Please enter a tool name",
      });
      return;
    }
    if (!newTool.code) {
      showErrorToast({
        title: "Missing Tool Code",
        position: "bottom-right",
        description: "Please enter a tool code",
      });
      return;
    }
    // TODO:: we might need to validate the code??
    try {
      createTool.mutate({
        name: newTool.name,
        description: newTool.description,
        code: newTool.code,
        dependencies: [],
        language: "javascript",
        projectId,
      });

      setNewTool({ name: "", description: "", code: "" });
      setIsToolDialogOpen(false);
    } catch (error) {
      console.error("Failed to create tool:", error);
    }
  };

  const openChatGPT = () => {
    const prompt = generateChatGPTPrompt({ toolConfig: newTool });
    window.open(`https://chat.openai.com/?q=${prompt}`, "_blank");
  };

  return (
    <Dialog open={isToolDialogOpen} onOpenChange={setIsToolDialogOpen}>
      <DialogTrigger asChild>
        {isLoadingTools ? (
          <Button disabled variant="outline" size="tiny">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </Button>
        ) : (
          (tools.length > 0 || forceShow) && (
            <div className="flex items-center gap-2 bg-transparent!">
              <DialogTrigger asChild>
                <Button variant="brand" size="sm" className="">
                  <PlusIcon className="h-4 w-4" />
                  Add New Tool
                </Button>
              </DialogTrigger>
            </div>
          )
        )}
      </DialogTrigger>
      <DialogContent className="w-[90vw]! max-w-3xl! h-[90vh]! max-h-175 p-4 flex flex-col">
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
              value={newTool.name}
              onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
              placeholder="my_custom_tool"
              disabled={createTool.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={newTool.description}
              onChange={(e) =>
                setNewTool({ ...newTool, description: e.target.value })
              }
              placeholder="What does this tool do?"
              disabled={createTool.isPending}
            />
          </div>

          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <Label>Tool Code (Typescript)</Label>
            <TypeScriptEditor
              className="flex-1 bg-gaia-200 dark:bg-gaia-950"
              code={newTool.code}
              onChange={(value) =>
                setNewTool({ ...newTool, code: value || "" })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsToolDialogOpen(false)}
            disabled={createTool.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={handleAddTool}
            disabled={!newTool.name || createTool.isPending}
          >
            {createTool.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Add Tool"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
