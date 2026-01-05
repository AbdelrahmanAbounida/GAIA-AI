import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex transition-colors  cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors  disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        zinc: "rounded-lg  mx-auto  bg-zinc-900 dark:bg-gaia-200 hover:opacity-90 hover:bg-zinc-800 text-white select-none inline-flex items-center gap-1 font-medium justify-center whitespace-nowrap transition-colors border-0.5 border-border-base  disabled:border-opacity-0  disabled:pointer-events-none disabled:shadow-none  shadow-sm   px-4 pt-[5.5px] pb-[6.5px] rounded-lg  h-[32px]",
        default:
          "bg-primary dark:bg-gaia-700 dark:hover:bg-gaia-300 text-primary-foreground shadow hover:bg-primary/90",
        brand: cn(
          "relative justify-center cursor-pointer inline-flex items-center space-x-2 text-center font-regular ease-out duration-200  outline-none transition-all outline-0  border text-foreground ",
          "dark:bg-brand-900! dark:hover:bg-brand-800/90! dark:hover:border-brand-500! dark:data-[state=open]:bg-brand-500/80! dark:border-brand-400/30!  dark:data-[state=open]:bg-brand-400/80! data-[state=open]:bg-gaia-900/80!",
          "bg-gaia-950! hover:bg-gaia-900/90!  border   text-white! data-[state=open]:outline-brand-600!",
          "rounded-lg dark:rounded-md"
        ),
        outline2: cn(
          "group/button inline-flex items-center justify-center font-medium whitespace-nowrap transition duration-100 ease-out select-none px-4 h-10 rounded-xl gap-2 text-base active:opacity-70 border-bg-border bg-bg-base-hover text-label-base border border-solid hover:bg-bg-shade hover:text-label-title cursor-pointer"
        ),
        destructive:
          "dark:hover:bg-red-950! text-white bg-red-500 hover:bg-red-600 dark:bg-[#541B15]! border! dark:border-red-900! dark:hover:border-red-700! transition-colors",
        outline:
          "border bg-white hover:bg-gaia-200 dark:border-[#464646] hover:border-gaia-400 dark:hover:border-zinc-600 dark:bg-gaia-900  dark:hover:bg-gaia-800/90 hover:text-accent-foreground",
        outline3:
          "border   dark:bg-[#242325] dark:border-gaia-700 dark:hover:border-gaia-700  dark:hover:bg-gaia-800/90 hover:text-accent-foreground",

        // "select-none inline-flex items-center gap-1 font-medium justify-center whitespace-nowrap transition-colors border-0.5   disabled:border-opacity-0  disabled:pointer-events-none disabled:shadow-none shadow-sm  text-content-primary  px-4 pt-[5.5px] pb-[6.5px] rounded-lg text-base h-[32px]",
        secondary:
          "bg-gaia-300 text-secondary-foreground shadow-sm hover:bg-gaia-300/80",
        ghost:
          "hover:bg-gaia-200 dark:hover:bg-gaia-900 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-10 dark:h-7 rounded-xl dark:rounded-md px-5 text-sm dark:text-xs",
        md: "h-8 rounded-md px-6",
        tiny: "text-sm dark:text-xs px-2.5 py-1 h-8 dark:h-[26px]", // px-2.5 py-1 h-[26px]
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
