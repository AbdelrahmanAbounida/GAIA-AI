import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const AlertMessage = ({
  title,
  description,
  descClassName,
}: {
  title?: string;
  description?: string;
  descClassName?: string;
}) => {
  return (
    <Alert variant="default" className="border-blue-500/50 dark:bg-blue-950/20">
      <AlertCircle className="h-4 w-4 text-blue-500!" />
      {title && (
        <AlertTitle className="text-sm font-medium dark:text-white">
          {title}
        </AlertTitle>
      )}
      <AlertDescription className={cn("text-xs", descClassName)}>
        {description}{" "}
      </AlertDescription>
    </Alert>
  );
};
