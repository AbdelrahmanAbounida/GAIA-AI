import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border  bg-transparent px-3 py-1 ",
          "text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium ",
          "file:text-foreground placeholder:text-gaia-500 placeholder:text-xs dark:placeholder:text-muted-foreground",
          " focus-visible:outline-none! focus-visible:ring-1 focus-visible:ring-gaia-100 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "dark:bg-gaia-950 bg-gaia-200 border-gaia-300 dark:border-gaia-700! dark:focus:bg-gaia-800! hover:bg-gaia-200/90 dark:hover:bg-gaia-800 ring-0! focus-visible:ring-0! focus-visible:ring-offset-0! focus-visible:ring-offset-transparent! dark:text-white",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
