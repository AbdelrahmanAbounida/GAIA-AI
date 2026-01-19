import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 dark:h-9 w-full rounded-xl dark:rounded-md border  dark:bg-transparent px-3 py-1 ",
          "text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium ",
          "file:text-foreground placeholder:text-gaia-500 placeholder:text-xs dark:placeholder:text-muted-foreground",
          " focus-visible:outline-none! focus-visible:ring-1 focus-visible:ring-gaia-100 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "dark:bg-gaia-800 bg-white border-gaia-400 dark:border-gaia-700! dark:focus:bg-gaia-950! hover:bg-white/90 dark:hover:bg-gaia-800 ring-0! focus-visible:ring-0! focus-visible:ring-offset-0! focus-visible:ring-offset-transparent! text-black dark:text-white",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
