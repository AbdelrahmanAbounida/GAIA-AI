"use client";
import { useState } from "react";
import { HoveredTabs } from "@/components/ui/hovered-tabs";
import { RAGTable } from "@/components/tables/rag-table";
import { RAGSettingsModal } from "@/components/modals/rag-settings-modal";
import { MCPCardView } from "@/components/mcp/mcp-card-view";
import { ToolsCardView } from "@/components/tools/tools-card-view";
import { NewToolDialog } from "@/components/tools/new-tool-dialog";
import { NewMCPDialog } from "@/components/mcp/new-mcp-dialog";
import { RAGModal } from "@/components/modals/rag-modal/rag-modal";

export default function ToolsPage() {
  // tabs state
  const [currentTab, setcurrentTab] = useState<"tools" | "mcp" | "knowledge">(
    "tools"
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-7">
      <div className="flex items-center justify-between">
        <div className="">
          <h2 className="text-xl font-bold text-foreground">Tools & MCP</h2>
          <p className="text-muted-foreground text-sm">
            Manage tools and MCP server connections for your RAG pipelines
          </p>
        </div>

        {currentTab === "tools" && (
          <div className="flex justify-end">
            <NewToolDialog />
          </div>
        )}

        {currentTab === "mcp" && (
          <div className="flex justify-end">
            <NewMCPDialog />
          </div>
        )}

        {currentTab === "knowledge" && (
          <div className="flex items-center gap-2">
            <RAGSettingsModal />
            <RAGModal />
          </div>
        )}
      </div>

      <div className="border-b">
        <HoveredTabs
          className="w-fit text-start justify-start!"
          tabs={["tools", "mcp", "knowledge"]}
          currentTab={currentTab}
          onChange={setcurrentTab}
        />
      </div>

      {currentTab === "tools" && <ToolsCardView />}

      {currentTab === "mcp" && <MCPCardView />}

      {currentTab == "knowledge" && <RAGTable />}
    </div>
  );
}
