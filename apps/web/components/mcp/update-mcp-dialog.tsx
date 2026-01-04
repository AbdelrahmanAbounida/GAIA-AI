import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useMCPServer, useMCPServers } from "@/hooks/use-mcp";
import { cn } from "@/lib/utils";
import { DBMcpServer } from "@gaia/ai";

export const UpdateMCPDialog = ({
  server,
  children,
  className,
}: {
  server: any;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [updateMCP, setUpdateMCP] = useState({
    name: "",
    url: "",
    transportType: "streamable-http" as "stdio" | "sse" | "streamable-http",
    connectionType: "direct" as "direct" | "proxy",
    command: "",
    args: "",
    proxyUrl: "",
    requestTimeout: 30000,
    maxTotalTimeout: 600000,
  });

  const { updateMCPServer } = useMCPServers({ showToasts: true });
  const { connectMCP } = useMCPServer({
    serverId: server.id,
    showToasts: true,
  });

  // Initialize form with server data when dialog opens
  useEffect(() => {
    if (open && server) {
      setUpdateMCP({
        name: server.name || "",
        url: server.url || "",
        transportType: server.transportType || "streamable-http",
        connectionType: server.connectionType || "direct",
        command: server.command || "",
        args: server.args || "",
        proxyUrl: server.proxyUrl || "",
        requestTimeout: server.requestTimeout || 30000,
        maxTotalTimeout: server.maxTotalTimeout || 600000,
      });
    }
  }, [open, server]);

  // Validation function
  const validateConfiguration = () => {
    // STDIO requires command
    if (updateMCP.transportType === "stdio" && !updateMCP.command.trim()) {
      return "Command is required for STDIO transport type";
    }

    // SSE/HTTP require URL
    if (
      (updateMCP.transportType === "sse" ||
        updateMCP.transportType === "streamable-http") &&
      !updateMCP.url.trim()
    ) {
      return "URL is required for SSE and HTTP transport types";
    }

    // STDIO cannot be direct
    if (
      updateMCP.transportType === "stdio" &&
      updateMCP.connectionType === "direct"
    ) {
      return "STDIO transport cannot use direct connection type. Please select proxy connection.";
    }

    // Proxy connection requires proxyUrl
    if (updateMCP.connectionType === "proxy" && !updateMCP.proxyUrl.trim()) {
      return "Proxy URL is required for proxy connection type";
    }

    // Name is always required
    if (!updateMCP.name.trim()) {
      return "Server name is required";
    }

    return "";
  };

  // Auto-adjust connection type when switching to STDIO
  useEffect(() => {
    if (
      updateMCP.transportType === "stdio" &&
      updateMCP.connectionType === "direct"
    ) {
      setUpdateMCP((prev) => ({ ...prev, connectionType: "proxy" }));
    }
  }, [updateMCP.transportType]);

  // Handle successful update - reconnect to server
  useEffect(() => {
    if (open && updateMCPServer.isSuccess && !updateMCPServer.isPending) {
      // Reconnect to server after successful update
      connectMCP.mutate({ id: server.id });
      updateMCPServer.reset();
      setOpen(false);
    }
  }, [updateMCPServer.isSuccess, updateMCPServer.isPending]);

  // Handle error - reset mutation state
  useEffect(() => {
    if (open && updateMCPServer.isError && !updateMCPServer.isPending) {
      // Don't close dialog on error, let user see the error message
      // Reset will be handled when they close the dialog or try again
    }
  }, [updateMCPServer.isError, updateMCPServer.isPending]);

  // Reset mutation state when dialog closes
  useEffect(() => {
    if (!open) {
      updateMCPServer.reset();
    }
  }, [open]);

  const handleUpdateMCPServer = async () => {
    const error = validateConfiguration();
    if (error) {
      return;
    }

    try {
      const payload: DBMcpServer = {
        id: server.id,
        name: updateMCP.name,
        projectId: server.projectId,
        transportType: updateMCP.transportType,
        connectionType: updateMCP.connectionType,
        requestTimeout: updateMCP.requestTimeout,
        maxTotalTimeout: updateMCP.maxTotalTimeout,
        status: "connecting",
      };

      // Add type-specific fields
      if (updateMCP.transportType === "stdio") {
        payload.command = updateMCP.command;
        if (updateMCP.args.trim()) {
          payload.args = updateMCP.args;
        }
      } else {
        payload.url = updateMCP.url;
      }

      // Add proxy URL if needed
      if (updateMCP.connectionType === "proxy") {
        payload.proxyUrl = updateMCP.proxyUrl;
      }

      await updateMCPServer.mutateAsync(payload);
    } catch (error) {
      console.error("Failed to update MCP server:", error);
    }
  };

  const isUpdating = updateMCPServer.isPending;
  const isFormValid = !validateConfiguration();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn("", className)}>
        {children ?? <Button size="sm">Update</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update MCP Server</DialogTitle>
          <DialogDescription>
            Modify the configuration for {server?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>
              Server Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={updateMCP.name}
              onChange={(e) =>
                setUpdateMCP({ ...updateMCP, name: e.target.value })
              }
              placeholder="My MCP Server"
              disabled={isUpdating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Transport Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={updateMCP.transportType}
                onValueChange={(value: any) =>
                  setUpdateMCP({ ...updateMCP, transportType: value })
                }
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streamable-http">
                    Streamable HTTP
                  </SelectItem>
                  <SelectItem value="sse">Server-Sent Events</SelectItem>
                  <SelectItem value="stdio">Standard I/O</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Connection Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={updateMCP.connectionType}
                onValueChange={(value: any) =>
                  setUpdateMCP({ ...updateMCP, connectionType: value })
                }
                disabled={isUpdating || updateMCP.transportType === "stdio"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="direct"
                    disabled={updateMCP.transportType === "stdio"}
                  >
                    Direct
                  </SelectItem>
                  <SelectItem value="proxy">Proxy</SelectItem>
                </SelectContent>
              </Select>
              {updateMCP.transportType === "stdio" && (
                <p className="text-xs text-muted-foreground">
                  STDIO requires proxy connection
                </p>
              )}
            </div>
          </div>

          {/* Show URL field for SSE and HTTP */}
          {(updateMCP.transportType === "sse" ||
            updateMCP.transportType === "streamable-http") && (
            <div className="space-y-2">
              <Label>
                Server URL <span className="text-destructive">*</span>
              </Label>
              <Input
                value={updateMCP.url}
                onChange={(e) =>
                  setUpdateMCP({ ...updateMCP, url: e.target.value })
                }
                placeholder="http://localhost:8080"
                disabled={isUpdating}
              />
            </div>
          )}

          {/* Show command field for STDIO */}
          {updateMCP.transportType === "stdio" && (
            <>
              <div className="space-y-2">
                <Label>
                  Command <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={updateMCP.command}
                  onChange={(e) =>
                    setUpdateMCP({ ...updateMCP, command: e.target.value })
                  }
                  placeholder="node server.js"
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label>Arguments (optional)</Label>
                <Input
                  value={updateMCP.args}
                  onChange={(e) =>
                    setUpdateMCP({ ...updateMCP, args: e.target.value })
                  }
                  placeholder="--port 8080"
                  disabled={isUpdating}
                />
              </div>
            </>
          )}

          {/* Show proxy URL field when proxy is selected */}
          {updateMCP.connectionType === "proxy" && (
            <div className="space-y-2">
              <Label>
                Proxy URL <span className="text-destructive">*</span>
              </Label>
              <Input
                value={updateMCP.proxyUrl}
                onChange={(e) =>
                  setUpdateMCP({ ...updateMCP, proxyUrl: e.target.value })
                }
                placeholder="https://proxy.example.com"
                disabled={isUpdating}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Request Timeout (ms)</Label>
              <Input
                type="number"
                value={updateMCP.requestTimeout}
                onChange={(e) =>
                  setUpdateMCP({
                    ...updateMCP,
                    requestTimeout: parseInt(e.target.value) || 30000,
                  })
                }
                disabled={isUpdating}
                min={1000}
                max={300000}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Total Timeout (ms)</Label>
              <Input
                type="number"
                value={updateMCP.maxTotalTimeout}
                onChange={(e) =>
                  setUpdateMCP({
                    ...updateMCP,
                    maxTotalTimeout: parseInt(e.target.value) || 600000,
                  })
                }
                disabled={isUpdating}
                min={10000}
                max={3600000}
              />
            </div>
          </div>

          {updateMCPServer.isError && (
            <div className="p-3 bg-destructive/10 rounded-md border border-destructive/30">
              <p className="text-sm text-destructive">
                {updateMCPServer.error?.message || "Failed to update server"}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size={"tiny"}
            className="px-5 h-[27px]"
            onClick={() => {
              setOpen(false);
            }}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant={"brand"}
            size={"tiny"}
            className="px-5"
            onClick={handleUpdateMCPServer}
            disabled={!isFormValid || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Server"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
