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
import { Loader2, Server, AlertCircle } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useMCPServers, useMCPServer } from "@/hooks/use-mcp";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const NewMCPDialog = ({ forceShow }: { forceShow?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [newMCP, setNewMCP] = useState({
    name: "",
    url: "",
    description: "",
    transportType: "streamable-http" as "stdio" | "sse" | "streamable-http",
    connectionType: "direct" as "direct" | "proxy",
    command: "",
    args: "",
    proxyUrl: "",
    requestTimeout: 30000,
    maxTotalTimeout: 600000,
  });

  const { isLoadingServers, servers, createMCPServer, projectId } =
    useMCPServers({ showToasts: true });

  const [createdServerId, setCreatedServerId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  const { connectMCP } = useMCPServer({
    serverId: createdServerId || "",
    showToasts: true,
  });

  // Validation function
  const validateConfiguration = () => {
    // STDIO requires command
    if (newMCP.transportType === "stdio" && !newMCP.command.trim()) {
      return "Command is required for STDIO transport type";
    }

    // SSE/HTTP require URL
    if (
      (newMCP.transportType === "sse" ||
        newMCP.transportType === "streamable-http") &&
      !newMCP.url.trim()
    ) {
      return "URL is required for SSE and HTTP transport types";
    }

    // STDIO cannot be direct
    if (
      newMCP.transportType === "stdio" &&
      newMCP.connectionType === "direct"
    ) {
      return "STDIO transport cannot use direct connection type. Please select proxy connection.";
    }

    // Proxy connection requires proxyUrl
    if (newMCP.connectionType === "proxy" && !newMCP.proxyUrl.trim()) {
      return "Proxy URL is required for proxy connection type";
    }

    // Name is always required
    if (!newMCP.name.trim()) {
      return "Server name is required";
    }

    return "";
  };

  // Update validation error whenever form changes
  useEffect(() => {
    setValidationError(validateConfiguration());
  }, [newMCP]);

  // Auto-adjust connection type when switching to STDIO
  useEffect(() => {
    if (
      newMCP.transportType === "stdio" &&
      newMCP.connectionType === "direct"
    ) {
      setNewMCP((prev) => ({ ...prev, connectionType: "proxy" }));
    }
  }, [newMCP.transportType]);

  const handleAddMCPServer = async () => {
    const error = validateConfiguration();
    if (error) {
      setValidationError(error);
      return;
    }
    try {
      const payload: any = {
        name: newMCP.name,
        projectId,
        transportType: newMCP.transportType,
        connectionType: newMCP.connectionType,
        requestTimeout: newMCP.requestTimeout,
        maxTotalTimeout: newMCP.maxTotalTimeout,
      };

      // Add type-specific fields
      if (newMCP.transportType === "stdio") {
        payload.command = newMCP.command;
        if (newMCP.args.trim()) {
          payload.args = newMCP.args;
        }
      } else {
        payload.url = newMCP.url;
      }

      // Add proxy URL if needed
      if (newMCP.connectionType === "proxy") {
        payload.proxyUrl = newMCP.proxyUrl;
      }

      const result = await createMCPServer.mutateAsync(payload);

      if (result.success && result.serverId) {
        setCreatedServerId(result.serverId);
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to create MCP server:", error);
    }
  };

  useEffect(() => {
    if (createdServerId && !connectMCP.isPending) {
      connectMCP.mutate({ id: createdServerId });
    }
  }, [createdServerId]);

  useEffect(() => {
    if (connectMCP.data?.success) {
      setNewMCP({
        name: "",
        url: "",
        description: "",
        transportType: "streamable-http",
        connectionType: "direct",
        command: "",
        args: "",
        proxyUrl: "",
        requestTimeout: 30000,
        maxTotalTimeout: 600000,
      });
      setCreatedServerId(null);
      setValidationError("");
    }
  }, [connectMCP.data]);

  const isCreating = createMCPServer.isPending;
  const isConnecting = connectMCP.isPending;
  const isProcessing = isCreating || isConnecting;
  const isFormValid = !validateConfiguration();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isLoadingServers}
          variant={isLoadingServers ? "outline" : "brand"}
          size="tiny"
        >
          {isLoadingServers ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Server className="size-3 dark:text-white" />
              Add Server
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
          <DialogDescription>
            {isConnecting
              ? "Connecting to your MCP server..."
              : "Connect to an MCP server to access additional tools"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>
              Server Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={newMCP.name}
              onChange={(e) => setNewMCP({ ...newMCP, name: e.target.value })}
              placeholder="My MCP Server"
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Transport Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newMCP.transportType}
                onValueChange={(value: any) =>
                  setNewMCP({ ...newMCP, transportType: value })
                }
                disabled={isProcessing}
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
                value={newMCP.connectionType}
                onValueChange={(value: any) =>
                  setNewMCP({ ...newMCP, connectionType: value })
                }
                disabled={isProcessing || newMCP.transportType === "stdio"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="direct"
                    disabled={newMCP.transportType === "stdio"}
                  >
                    Direct
                  </SelectItem>
                  <SelectItem value="proxy">Proxy</SelectItem>
                </SelectContent>
              </Select>
              {newMCP.transportType === "stdio" && (
                <p className="text-xs text-muted-foreground">
                  STDIO requires proxy connection
                </p>
              )}
            </div>
          </div>

          {/* Show URL field for SSE and HTTP */}
          {(newMCP.transportType === "sse" ||
            newMCP.transportType === "streamable-http") && (
            <div className="space-y-2">
              <Label>
                Server URL <span className="text-destructive">*</span>
              </Label>
              <Input
                value={newMCP.url}
                onChange={(e) => setNewMCP({ ...newMCP, url: e.target.value })}
                placeholder="http://localhost:8080"
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Show command field for STDIO */}
          {newMCP.transportType === "stdio" && (
            <>
              <div className="space-y-2">
                <Label>
                  Command <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={newMCP.command}
                  onChange={(e) =>
                    setNewMCP({ ...newMCP, command: e.target.value })
                  }
                  placeholder="node server.js"
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <Label>Arguments (optional)</Label>
                <Input
                  value={newMCP.args}
                  onChange={(e) =>
                    setNewMCP({ ...newMCP, args: e.target.value })
                  }
                  placeholder="--port 8080"
                  disabled={isProcessing}
                />
              </div>
            </>
          )}

          {/* Show proxy URL field when proxy is selected */}
          {newMCP.connectionType === "proxy" && (
            <div className="space-y-2">
              <Label>
                Proxy URL <span className="text-destructive">*</span>
              </Label>
              <Input
                value={newMCP.proxyUrl}
                onChange={(e) =>
                  setNewMCP({ ...newMCP, proxyUrl: e.target.value })
                }
                placeholder="https://proxy.example.com"
                disabled={isProcessing}
              />
            </div>
          )}
          {/* 
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Request Timeout (ms)</Label>
              <Input
                type="number"
                value={newMCP.requestTimeout}
                onChange={(e) =>
                  setNewMCP({
                    ...newMCP,
                    requestTimeout: parseInt(e.target.value) || 30000,
                  })
                }
                disabled={isProcessing}
                min={1000}
                max={300000}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Total Timeout (ms)</Label>
              <Input
                type="number"
                value={newMCP.maxTotalTimeout}
                onChange={(e) =>
                  setNewMCP({
                    ...newMCP,
                    maxTotalTimeout: parseInt(e.target.value) || 600000,
                  })
                }
                disabled={isProcessing}
                min={10000}
                max={3600000}
              />
            </div>
          </div> */}

          {isConnecting && (
            <div className="flex items-center gap-2 p-3 bg-gaia-50 dark:bg-gaia-950/30 rounded-md border border-gaia-200 dark:border-gaia-800">
              <Loader2 className="h-4 w-4 animate-spin text-gaia-600" />
              <span className="text-sm text-gaia-700 dark:text-gaia-300">
                Establishing connection to server...
              </span>
            </div>
          )}

          {createMCPServer.isError && (
            <div className="p-3 bg-destructive/10 rounded-md border border-destructive/30">
              <p className="text-sm text-destructive">
                {createMCPServer.error?.message || "Failed to create server"}
              </p>
            </div>
          )}

          {connectMCP.isError && (
            <div className="p-3 bg-destructive/10 rounded-md border border-destructive/30">
              <p className="text-sm text-destructive">
                {connectMCP.error?.message || "Failed to connect to server"}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size={"tiny"}
            className="px-5 dark:h-[27px]"
            onClick={() => {
              setOpen(false);
              setCreatedServerId(null);
              setValidationError("");
            }}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant={"brand"}
            size={"tiny"}
            className="px-5"
            onClick={handleAddMCPServer}
            disabled={!isFormValid || isProcessing}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Create & Connect"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
