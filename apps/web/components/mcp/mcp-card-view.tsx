import { useEffect, useState } from "react";
import { NewMCPDialog } from "./new-mcp-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  CheckIcon,
  Plug,
  RefreshCw,
  Server,
  Terminal,
  Trash2,
  XCircle,
  AlertCircle,
  Globe,
  Command,
  Loader,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { useMCPServers, useMCPServer } from "@/hooks/use-mcp";
import { Skeleton } from "../ui/skeleton";
import { ConfirmModal } from "../modals/confirm-modal";
import { UpdateMCPDialog } from "./update-mcp-dialog";

export const MCPCardView = () => {
  const { servers, isLoadingServers, deleteMCPServer } = useMCPServers({
    showToasts: true,
  });

  const handleDeleteServer = (serverId: string) => {
    deleteMCPServer.mutate({
      id: serverId,
    });
  };

  if (isLoadingServers)
    return (
      <div className="flex flex-wrap w-full items-center justify-center h-75">
        <Loader className="animate-spin text-brand-700" />
      </div>
    );

  if (!isLoadingServers && servers?.length === 0) return <EmptyServers />;

  return (
    <div className="space-y-6">
      <Card className="shadow-none dark:shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-green-700" />
                MCP Server Connections
              </CardTitle>
              <CardDescription className="pl-1">
                Connect to Model Context Protocol servers to extend your agent's
                capabilities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {servers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MCPIcon />
              <h3 className="mb-2 text-lg font-semibold">
                No MCP servers connected
              </h3>
              <p className="mb-4 text-center text-muted-foreground">
                Connect to MCP servers to access additional tools and
                capabilities.
              </p>
              <NewMCPDialog forceShow />
            </div>
          ) : (
            <div className="space-y-4">
              {servers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onDelete={handleDeleteServer}
                  isDeleting={deleteMCPServer.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ServerCard = ({
  server,
  onDelete,
  isDeleting,
}: {
  server: any;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const { connectMCP, disconnectMCP, tools } = useMCPServer({
    serverId: server.id,
    showToasts: true,
  });

  const handleReconnect = async () => {
    try {
      connectMCP.mutate({ id: server.id });
    } catch (error) {
      console.error("Reconnection failed:", error);
    }
  };

  const handleToggleConnection = async (checked: boolean) => {
    try {
      if (checked) {
        connectMCP.mutate({ id: server.id });
      } else {
        disconnectMCP.mutate({ id: server.id });
      }
    } catch (error) {
      console.error("Toggle connection failed:", error);
    }
  };

  const isConnecting =
    server.status === "connecting" ||
    connectMCP.isPending ||
    connectMCP.isPending ||
    disconnectMCP.isPending;

  const getStatusDisplay = () => {
    const status = server.status;

    if (isConnecting) {
      return (
        <>
          <RefreshCw className="size-3.5 animate-spin text-gaia-500 dark:text-gaia-400" />
          <span className="text-sm text-gaia-500 dark:text-gaia-400">
            {connectMCP.isPending ? "Reconnecting..." : "Connecting..."}
          </span>
        </>
      );
    }

    switch (status) {
      case "connected":
        const toolCount = tools?.length || 0;
        return (
          <>
            <CheckIcon className="p-0.5 text-white size-3.5 border-white bg-green-800 rounded-2xl" />
            <span className="text-sm text-green-700 dark:text-green-600 mr-2">
              Connected
            </span>
            <Badge variant="secondary">
              {toolCount} tool{toolCount !== 1 ? "s" : ""}
            </Badge>
          </>
        );
      case "connecting":
        return (
          <>
            <RefreshCw className="size-3.5 animate-spin text-gaia-500 dark:text-gaia-400" />
            <span className="text-sm text-gaia-500 dark:text-gaia-400">
              Connecting...
            </span>
          </>
        );
      case "disconnected":
        return (
          <>
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">Disconnected</span>
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">Error</span>
            {server.lastError && (
              <span className="text-xs text-destructive/70 ml-1 max-w-50 truncate">
                ({server.lastError})
              </span>
            )}
          </>
        );
      default:
        return (
          <>
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Unknown</span>
          </>
        );
    }
  };

  const getTransportIcon = () => {
    switch (server.transportType) {
      case "stdio":
        return <Command className="h-4 w-4" />;
      case "sse":
      case "streamable-http":
        return <Globe className="h-4 w-4" />;
      default:
        return <Terminal className="h-4 w-4" />;
    }
  };

  const getConnectionInfo = () => {
    if (server.transportType === "stdio") {
      return server.command || "STDIO";
    }
    return server.url || "No URL";
  };

  return (
    <UpdateMCPDialog server={server} className="w-full">
      <div className="flex items-center justify-between rounded-lg border border-border p-4 dark:hover:border-gaia-700/60 dark:hover:bg-gaia-800/50 cursor-pointer transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg dark:bg-secondary/70 dark:border-gaia-700/70 border">
            {getTransportIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{server.name}</p>
              <Badge variant="outline" className="text-xs">
                {server.transportType === "stdio"
                  ? "STDIO"
                  : server.transportType === "sse"
                    ? "SSE"
                    : "HTTP"}
              </Badge>
              {server.connectionType === "proxy" && (
                <Badge variant="outline" className="text-xs">
                  Proxy
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {getConnectionInfo()}
            </p>

            {server.status === "connected" && server.protocolVersion && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Protocol: {server.protocolVersion}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">{getStatusDisplay()}</div>
          <div className="flex gap-2 items-center">
            <Switch
              checked={server.status === "connected"}
              onCheckedChange={handleToggleConnection}
              disabled={isConnecting}
              onClick={(e) => e.stopPropagation()}
              title={
                server.status === "connected"
                  ? "Disconnect server"
                  : "Connect server"
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleReconnect();
              }}
              disabled={isConnecting}
              title="Reconnect to server"
            >
              <RefreshCw
                className={`h-4 w-4 ${isConnecting ? "animate-spin" : ""}`}
              />
            </Button>
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmModal
                onDelete={() => {
                  onDelete(server.id);
                }}
                description="Are you sure you want to delete this server? This action cannot be undone."
                isPending={isDeleting}
              >
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  title="Delete server"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ConfirmModal>
            </div>
          </div>
        </div>
      </div>
    </UpdateMCPDialog>
  );
};

const EmptyServers = () => {
  return (
    <Card className="border-none shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="inline-flex items-center justify-center size-11 bg-white dark:bg-gaia-800 border border-gaia-400 dark:border-gaia-700 rounded-xl mb-3">
          <Server className="size-6  text-[#3BA34A] dark:text-brand-800" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          No Servers Found
        </h3>
        <p className="text-gray-500/80 dark:text-zinc-400 text-sm mb-6">
          Connect to an MCP server to access additional tools
        </p>

        <NewMCPDialog forceShow />
      </CardContent>
    </Card>
  );
};

const MCPIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="32"
      height="32"
      color="green"
      fill="none"
      stroke="green"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499" />
      <path d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32822 15.921C6.22373 14.8164 6.22373 13.0255 7.32822 11.921L13.4999 5.74939" />
    </svg>
  );
};
