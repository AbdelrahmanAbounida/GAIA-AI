import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-gaia-300/90 dark:border-input px-3 py-2 text-base dark:shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "bg-[#FEFEFB] dark:bg-gaia-900",
        "outline-none ring-0! focus:outline-none!  focus:ring-0! focus-visible:outline-none! focus-visible:ring-0!",
        className
      )}
      value={props.value || ""}
      {...props}
    />
  );
}
Textarea.displayName = "Textarea";
export { Textarea };
