import React, { ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { Trash, Loader2 } from "lucide-react";

export const ConfirmModal = ({
  onDelete,
  children,
  description,
  className,
  isPending,
}: {
  onDelete: () => Promise<any> | any;
  children?: ReactNode;
  description?: string;
  className?: string;
  isPending?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(isPending);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      // Only close if the delete was successful
      setOpen(false);
    } catch (error) {
      console.error("Delete failed:", error);
      // Keep dialog open on error so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isLoading) setOpen(newOpen);
      }}
    >
      {/* CUSTOM TRIGGER BUTTON (NOT AlertDialogTrigger) */}
      <div
        className={cn("w-full", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // important when inside another dialog
          setOpen(true);
        }}
      >
        {children}
      </div>
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          if (isLoading) e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <Trash className="mr-2 size-4" /> Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? "This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="ml-auto pt-9">
          <AlertDialogCancel
            className={cn(
              "dark:h-7 px-7",
              buttonVariants({ variant: "outline", size: "sm" })
            )}
            disabled={isLoading}
            onClick={(e) => {
              if (isLoading) e.preventDefault();
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            className={cn(
              buttonVariants({ variant: "destructive", size: "sm" }),
              "text-white dark:h-7 px-7"
            )}
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
