import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const AlertMessage = ({
  title,
  description,
  titleClassName,
  descClassName,
  iconClassName,
  className,
}: {
  title?: string;
  description?: string;
  titleClassName?: string;
  descClassName?: string;
  iconClassName?: string;
  className?: string;
}) => {
  return (
    <Alert
      variant="default"
      className={cn("border-blue-500/50  dark:bg-blue-950/20", className)}
    >
      <AlertCircle className={cn("h-4 w-4 text-blue-500!", iconClassName)} />
      {title && (
        <AlertTitle
          className={cn(
            "text-sm font-medium text-blue-500 dark:text-white",
            titleClassName
          )}
        >
          {title}
        </AlertTitle>
      )}
      <AlertDescription className={cn("text-xs", descClassName)}>
        {description}{" "}
      </AlertDescription>
    </Alert>
  );
};
