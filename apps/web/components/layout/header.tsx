"use client";
import { DatabaseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserNav } from "./user-nav";
import { RAGModal } from "../modals/rag-modal";

export function Header({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex py-3! items-center justify-between  border-border  px-6 ",
        className
      )}
    >
      <div className="flex gap-2"></div>

      <div className="flex items-center">
        <RAGModal>
          <Button variant={"outline"} size={"tiny"} className="py-3 h-7">
            <DatabaseIcon className="size-3!" />
            <span className="">Add Data</span>
          </Button>
        </RAGModal>
        <UserNav showLong={false} align="end" menuClassName="mt-1 mr-2" />
      </div>
    </header>
  );
}
