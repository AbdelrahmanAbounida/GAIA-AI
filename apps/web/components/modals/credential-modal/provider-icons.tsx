import { Sparkles } from "lucide-react";
import { Icons } from "@/const/icons";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useMemo } from "react";

export function ProviderIcon({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  const { theme } = useTheme();

  const iconSrc = useMemo(() => {
    const cleanProvider = provider
      .replace(/\s*\(.*?\).*/, "")
      .trim()
      .toLowerCase();

    const isDark = theme === "dark";

    // Try theme-specific icon first
    const themeKey = !isDark ? `${cleanProvider}Light` : cleanProvider;

    // Check if theme-specific icon exists
    const themedIcon = Icons[themeKey as keyof typeof Icons];
    if (themedIcon) return themedIcon;

    // Fallback to base icon
    const baseIcon = Icons[cleanProvider as keyof typeof Icons];
    return baseIcon;
  }, [provider, theme]);

  if (iconSrc) {
    return (
      <Image
        src={iconSrc}
        alt={provider}
        className={cn("", className)}
        width={20}
        height={20}
      />
    );
  }

  return <Sparkles className={className} />;
}
