"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "./button";
import { VariantProps } from "class-variance-authority";

type CopyButtonProps = {
  content: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline";
  className?: string;
  onCopy?: (content: string) => void;
  iconClassName?: string;
};
export function CopyButton({
  content,
  size = "icon",
  variant = "ghost",
  className,
  iconClassName,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.(content);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded hover:bg-gaia-300 dark:hover:bg-gaia-800 transition-colors cursor-pointer",
        className
      )}
      title="copy file"
    >
      {copied ? (
        <CheckIcon className={"h-4 w-4 text-green-700"} />
      ) : (
        <CopyIcon className={cn("h-4 w-4 text-gray-200", iconClassName)} />
      )}
    </button>
  );
}
