import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Code,
  FileSearch,
  Globe,
  MoreVertical,
  Trash2,
  Wrench,
  LayoutGrid,
  List,
  CodeIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTools } from "@/hooks/use-tools";
import { NewToolDialog } from "./new-tool-dialog";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "../modals/confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditToolDialog } from "./update-tool-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tool } from "@gaia/db";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  WrenchIcon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Power,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const builtinToolIcons: Record<string, React.ReactNode> = {
  "web-search": <Globe className="h-4 w-4" />,
  calculator: <Calculator className="h-4 w-4" />,
  "file-search": <FileSearch className="h-4 w-4" />,
};

export const ToolsCardView = () => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { tools, isLoadingTools } = useTools({
    showToasts: true,
  });
  if (isLoadingTools)
    return (
      <div className="flex flex-wrap">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-1/3 p-4">
            <Skeleton className="h-40 rounded-lg" />
          </div>
        ))}
      </div>
    );

  if (!isLoadingTools && tools.length === 0) return <EmptyTools />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs
          value={viewMode}
          className="ml-auto"
          onValueChange={(v) => setViewMode(v as "cards" | "table")}
        >
          <TabsList className="h-8 dark:bg-gaia-900 dark:border-gaia-700/40">
            <TabsTrigger value="cards" className="gap-2 dark:border-gaia-800 ">
              <LayoutGrid className="h-4 w-4" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "cards" ? <CardsView /> : <TableView />}
    </div>
  );
};

const CardsView = () => {
  const { tools, isLoadingTools, triggerToolActivation, deleteTool } = useTools(
    {
      showToasts: true,
    }
  );
  const handleToggleTool = (toolId: string, activeState: boolean) => {
    triggerToolActivation.mutate({ toolId, activeState });
  };

  const handleDeleteTool = (toolId: string) => {
    deleteTool.mutate({
      id: toolId,
    });
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <EditToolDialog tool={tool} key={tool.id}>
            <Card
              key={tool.id}
              className={cn(
                "group relative shadow-none bg-gaia-200! border-gaia-400 hover:border-gaia-500 dark:bg-gaia-800! dark:border-gaia-700 cursor-pointer transition-all dark:hover:bg-gaia-800/40 dark:hover:border-zinc-800"
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {builtinToolIcons[tool.id] || (
                      <CodeIcon className="h-5 w-5 text-green-700" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium">
                      {tool.name}
                    </CardTitle>
                    <p className="line-clamp-3 text-[13px] text-gaia-600 dark:text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={tool.enabled}
                    onCheckedChange={(enabled) =>
                      handleToggleTool(tool.id, enabled)
                    }
                    // Prevent card click propagation if you add onClick to Card
                    onClick={(e) => e.stopPropagation()}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="gap-3! space-y-1 ml-3"
                    >
                      <EditToolDialog tool={tool} />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <ConfirmModal
                          description="Are you sure you want to delete this tool?"
                          onDelete={() => handleDeleteTool(tool.id)}
                        >
                          <DropdownMenuItem
                            onClick={(e) => e.preventDefault()}
                            className="w-full text-destructive flex items-center justify-start gap-2  p-0"
                          >
                            <Trash2 className="mr-2  size-3.5 " />
                            Delete
                          </DropdownMenuItem>
                        </ConfirmModal>
                      </DropdownMenuItem>

                      {/* */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent></CardContent>
            </Card>
          </EditToolDialog>
        ))}
      </div>
    </div>
  );
};

function TableView() {
  const {
    tools,
    total,
    page,
    pageCount,
    setPage,
    isLoadingTools,
    isPlaceholderData,
    deleteTool,
    triggerToolActivation,
    projectId,
  } = useTools({ pageSize: 10 });

  const handleDelete = (tool: Tool) => {
    if (tool.id) {
      deleteTool.mutate({ id: tool.id });
    }
  };

  const handleToggleActivation = (tool: Tool) => {
    if (tool.id) {
      triggerToolActivation.mutate({
        // id: tool.id,
        // isActive: !tool.isActive,
        toolId: tool.id,
        activeState: !tool.enabled,
      });
    }
  };

  if (isLoadingTools) {
    return <div className="py-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {tools.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-muted-foreground"
                >
                  No tools found
                </TableCell>
              </TableRow>
            ) : (
              tools.map((tool) => (
                <TableRow
                  key={tool.id}
                  className={isPlaceholderData ? "opacity-50" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tool.name}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-md truncate">
                      {tool.description || "No description"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={tool.enabled ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {tool.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {format(new Date(tool.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleActivation(tool)}
                          disabled={triggerToolActivation.isPending}
                        >
                          <Power className="h-4 w-4 mr-2" />
                          {tool.enabled ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>

                        <EditToolDialog tool={tool} key={tool.id}>
                          <Button
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "relative w-full bg-transparent! justify-start flex cursor-pointer first:rounded-t-xl last:rounded-b-xl select-none items-center gap-2 rounded-md px-2 h-9 text-sm outline-none transition-colors dark:focus:bg-gaia-700/30 dark:focus:text-bg-gaia-700-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
                              "h-7 text-xs hover:bg-gaia-200 dark:hover:bg-gaia-800!"
                            )}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </EditToolDialog>

                        <ConfirmModal
                          onDelete={() => handleDelete(tool)}
                          isPending={deleteTool.isPending}
                          description="Are you sure you want to delete this tool? This action cannot be undone."
                        >
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => e.preventDefault()}
                            disabled={deleteTool.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </ConfirmModal>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {page * 10 + 1} to {Math.min((page + 1) * 10, total)} of{" "}
            {total} tools
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isPlaceholderData}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Page {page + 1} of {pageCount}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount - 1 || isPlaceholderData}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const EmptyTools = () => {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gaia-200 dark:bg-gaia-800">
          <Wrench className="h-6 w-6 text-green-600" />
        </div>

        <h3 className="mb-1 text-lg font-semibold">No Tool Created</h3>

        <p className="mb-4 text-center text-sm text-gray-500 dark:text-muted-foreground">
          Build and configure AI tools tailored to your workflow. Add your first
          tool to get started.
        </p>

        <NewToolDialog forceShow />
      </CardContent>
    </Card>
  );
};
