"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader, SquareChevronRightIcon } from "lucide-react";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { orpcQueryClient } from "@/lib/orpc/client";
import { useCurrentProjectId } from "@/hooks/use-projects";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const PromptModal = () => {
  const { projectId } = useCurrentProjectId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [promptValue, setPromptValue] = useState("");

  const { data: currentPrompt, isPending: isLoadingPrompt } = useQuery(
    orpcQueryClient.authed.prompt.get.queryOptions({
      input: { projectId },
    })
  );

  const { mutate: updatePrompt, isPending: isSaving } = useMutation(
    orpcQueryClient.authed.prompt.update.mutationOptions({
      onSuccess: (data) => {
        if (!data?.success) {
          showErrorToast({
            title: "Failed to update prompt",
            position: "bottom-left",
            description: data.message || "Something went wrong",
          });
          return;
        }

        showSuccessToast({
          title: "Success",
          description: data.message || "Prompt updated successfully",
          position: "bottom-right",
        });

        setOpen(false);
      },
      onError: (error) => {
        showErrorToast({
          title: "Failed to update prompt",
          position: "bottom-left",
          description: error.message || "Something went wrong",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.project.list.key(),
        });
      },
    })
  );

  useEffect(() => {
    if (currentPrompt?.prompt?.content) {
      setPromptValue(currentPrompt.prompt.content);
    }
  }, [currentPrompt]);

  const handleSave = () => {
    if (!promptValue.trim()) {
      showErrorToast({
        title: "Failed to update prompt",
        position: "bottom-left",
        description: "Prompt is required.",
      });
      return;
    }

    updatePrompt({ projectId, prompt: promptValue });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "w-full h-7 pl-2 flex rounded-md items-center justify-start hover:bg-transparent cursor-pointer",
            "h-7 text-xs hover:bg-gaia-200 dark:hover:bg-gaia-700/30"
          )}
        >
          <SquareChevronRightIcon className="mr-3 ml-0 size-3.5! dark:text-white" />
          Customize Prompt
        </div>
      </DialogTrigger>

      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="min-w-[95%] max-h-[95%] h-full flex flex-col gap-0 mt-3"
      >
        <DialogHeader className="pl-1">
          <DialogTitle className="flex items-end gap-2">
            <p>Edit Prompt</p>
            <FileText className="w-4 h-4 text-black" />
          </DialogTitle>
          <DialogDescription>
            Update prompt content to personalize the AI response
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 mt-3">
          {isLoadingPrompt ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader className="animate-spin w-6 h-6" />
            </div>
          ) : (
            <Textarea
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              style={{ resize: "none" }}
              className="w-full h-full"
              placeholder="Enter your prompt here..."
            />
          )}
        </div>

        <DialogFooter className="pt-3">
          <DialogClose asChild>
            <Button size="sm" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            variant="brand"
            size="sm"
            className="px-11"
            onClick={handleSave}
            disabled={isSaving || isLoadingPrompt}
          >
            {isSaving ? <Loader className="animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
