"use client";
import { Monitor, Sun, Moon, PaletteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export function ThemeSwitcher({ withIcon }: { withIcon?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "flex items-center justify-between py-3",
        "relative flex cursor-pointer first:rounded-t-xl last:rounded-b-xl select-none items-center gap-2 rounded-md px-2 h-9 text-sm outline-none transition-colors dark:focus:bg-gaia-700/30 dark:focus:text-bg-gaia-700-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0"
      )}
    >
      {withIcon && (
        <div className="flex items-center gap-2">
          <PaletteIcon className="w-4 h-4 dark:text-white" />
          <span className="text-xs  text-muted-foreground">Theme</span>
        </div>
      )}
      <div className="flex items-center gap-0.5 rounded-full bg-gaia-200 dark:bg-gaia-800 p-0.5 border dark:border-gaia-700">
        <button
          onClick={() => setTheme("system")}
          className={cn(
            "flex size-4 cursor-pointer items-center justify-center rounded-full transition-colors",
            theme === "system"
              ? "bg-gaia-100 dark:bg-foreground text-gaia-700"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="System theme"
        >
          <Monitor className="size-3!" />
        </button>
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex size-4 cursor-pointer items-center justify-center rounded-full transition-colors",
            theme === "light"
              ? "bg-gaia-100 dark:bg-foreground "
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Light theme"
        >
          <Sun className="size-3!" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex size-4 cursor-pointer items-center justify-center rounded-full transition-colors",
            theme === "dark"
              ? "dark:bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Moon theme"
        >
          <Moon className="size-3!" />
        </button>
      </div>
    </div>
  );
}
