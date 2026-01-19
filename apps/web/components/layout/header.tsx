"use client";
import { DatabaseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserNav } from "./user-nav";
import { RAGModal } from "../modals/rag-modal/rag-modal";
import { useParams } from "next/navigation";

export function Header({ className }: { className?: string }) {
  const { id: projectId } = useParams<{ id: string }>();
  return (
    <header
      className={cn(
        "flex py-1! items-center justify-between  border-border  px-6 ",
        className,
      )}
    >
      <div className="flex gap-2"></div>
    </header>
  );
}
