import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { useEffect } from "react";
import { useParams } from "next/navigation";

interface UseMCPServersOptions {
  onSuccess?: () => void;
  showToasts?: boolean;
}

export const useMCPServers = ({
  onSuccess,
  showToasts = true,
}: UseMCPServersOptions = {}) => {
  const queryClient = useQueryClient();

  const params = useParams<{ id: string }>();
  const projectId = params.id!;

  const {
    data: serversResponse,
    isPending: isLoadingServers,
    isError: isServersError,
    error: serversError,
  } = useQuery(
    orpcQueryClient.authed.mcp.listMCPServers.queryOptions({
      input: { projectId },
    })
  );

  // Show error toast for list queries
  useEffect(() => {
    if (showToasts && isServersError) {
      showErrorToast({
        title: "Failed to get MCP servers",
        position: "bottom-right",
        description: serversError?.message || "Something went wrong",
      });
    }
  }, [isServersError, serversError, showToasts]);

  const invalidateServers = () => {
    queryClient.invalidateQueries({
      queryKey: orpcQueryClient.authed.mcp.listMCPServers.key(),
    });
  };

  const invalidateServer = (id: string) => {
    queryClient.invalidateQueries({
      queryKey: orpcQueryClient.authed.mcp.getMCPServer.key({ input: { id } }),
    });
  };

  const validateMCP = useMutation(
    orpcQueryClient.authed.mcp.validateMCP.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && data.valid) {
          showSuccessToast({
            title: "Server validated",
            position: "bottom-right",
            description: data.message || "MCP server is valid",
          });
        } else if (showToasts && !data.valid) {
          showErrorToast({
            title: "Validation failed",
            position: "bottom-right",
            description: data.message || "Server validation failed",
          });
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to validate server",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
    })
  );

  const detectAuth = useMutation(
    orpcQueryClient.authed.mcp.detectAuth.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && !data.success && data.error) {
          showErrorToast({
            title: "Failed to detect authentication",
            position: "bottom-right",
            description: data.error,
          });
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to detect authentication",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
    })
  );

  const detectTransport = useMutation(
    orpcQueryClient.authed.mcp.detectTransport.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && !data.success && data.message) {
          showErrorToast({
            title: "Failed to detect transport",
            position: "bottom-right",
            description: data.message,
          });
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to detect transport",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
    })
  );

  const createMCPServer = useMutation(
    orpcQueryClient.authed.mcp.createMCPServer.mutationOptions({
      onSuccess: (data) => {
        if (showToasts) {
          if (data.success) {
            showSuccessToast({
              title: "MCP server created",
              position: "bottom-right",
              description: data.message || "Server created successfully",
            });
          } else {
            showErrorToast({
              title: "Failed to create server",
              position: "bottom-right",
              description: data.message || "Something went wrong",
            });
          }
        }
        if (data.success) {
          onSuccess?.();
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to create MCP server",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: () => {
        invalidateServers();
      },
    })
  );

  const updateMCPServer = useMutation(
    orpcQueryClient.authed.mcp.updateMCPServer.mutationOptions({
      onSuccess: (data, variables) => {
        if (showToasts) {
          if (data.success) {
            showSuccessToast({
              title: "MCP server updated",
              position: "bottom-right",
              description: data.message || "Server updated successfully",
            });
          } else if (data.message) {
            showErrorToast({
              title: "Failed to update server",
              position: "bottom-right",
              description: data.message,
            });
          }
        }
        if (data.success) {
          onSuccess?.();
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to update MCP server",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: (data, error, variables) => {
        invalidateServers();
        invalidateServer(variables.id);
      },
    })
  );

  const deleteMCPServer = useMutation(
    orpcQueryClient.authed.mcp.deleteMCPServer.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && data.success) {
          showSuccessToast({
            title: "MCP server deleted",
            position: "bottom-right",
            description: "Server deleted successfully",
          });
        }
        if (data.success) {
          onSuccess?.();
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to delete MCP server",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: () => {
        invalidateServers();
      },
    })
  );

  const servers = serversResponse?.servers || [];

  return {
    // Data
    servers,
    projectId,

    // Loading states
    isLoadingServers,

    // Error states
    isServersError,
    serversError,

    // Validation mutations
    validateMCP: {
      mutate: validateMCP.mutate,
      mutateAsync: validateMCP.mutateAsync,
      isPending: validateMCP.isPending,
      isError: validateMCP.isError,
      error: validateMCP.error,
      data: validateMCP.data,
    },
    detectAuth: {
      mutate: detectAuth.mutate,
      mutateAsync: detectAuth.mutateAsync,
      isPending: detectAuth.isPending,
      isError: detectAuth.isError,
      error: detectAuth.error,
      data: detectAuth.data,
    },
    detectTransport: {
      mutate: detectTransport.mutate,
      mutateAsync: detectTransport.mutateAsync,
      isPending: detectTransport.isPending,
      isError: detectTransport.isError,
      error: detectTransport.error,
      data: detectTransport.data,
    },

    // CRUD mutations
    createMCPServer: {
      mutate: createMCPServer.mutate,
      mutateAsync: createMCPServer.mutateAsync,
      isPending: createMCPServer.isPending,
      isError: createMCPServer.isError,
      error: createMCPServer.error,
      data: createMCPServer.data,
    },
    updateMCPServer: {
      mutate: updateMCPServer.mutate,
      mutateAsync: updateMCPServer.mutateAsync,
      isPending: updateMCPServer.isPending,
      isError: updateMCPServer.isError,
      error: updateMCPServer.error,
      isSuccess: updateMCPServer.isSuccess,
      reset: updateMCPServer.reset,
    },
    deleteMCPServer: {
      mutate: deleteMCPServer.mutate,
      mutateAsync: deleteMCPServer.mutateAsync,
      isPending: deleteMCPServer.isPending,
      isError: deleteMCPServer.isError,
      error: deleteMCPServer.error,
    },

    // Invalidation helpers
    invalidateServers,
    invalidateServer,
  };
};

export const useMCPServer = ({
  serverId,
  onSuccess,
  showToasts = true,
}: {
  serverId: string;
  onSuccess?: () => void;
  showToasts?: boolean;
}) => {
  const queryClient = useQueryClient();

  // Get specific MCP server
  const {
    data: serverResponse,
    isPending: isLoadingServer,
    isError: isServerError,
    error: serverError,
  } = useQuery(
    orpcQueryClient.authed.mcp.getMCPServer.queryOptions({
      input: { id: serverId },
    })
  );

  // List tools for specific server
  const {
    data: toolsResponse,
    isPending: isLoadingTools,
    isError: isToolsError,
    error: toolsError,
  } = useQuery(
    orpcQueryClient.authed.mcp.listMCPTools.queryOptions({
      input: { id: serverId },
    })
  );

  // List resources for specific server
  const {
    data: resourcesResponse,
    isPending: isLoadingResources,
    isError: isResourcesError,
    error: resourcesError,
  } = useQuery(
    orpcQueryClient.authed.mcp.listMCPResources.queryOptions({
      input: { id: serverId },
    })
  );

  // List prompts for specific server
  const {
    data: promptsResponse,
    isPending: isLoadingPrompts,
    isError: isPromptsError,
    error: promptsError,
  } = useQuery(
    orpcQueryClient.authed.mcp.listMCPPrompts.queryOptions({
      input: { id: serverId },
    })
  );

  // Invalidation helpers
  const invalidateServers = () => {
    queryClient.invalidateQueries({
      queryKey: orpcQueryClient.authed.mcp.listMCPServers.key(),
    });
  };

  const invalidateServer = () => {
    queryClient.invalidateQueries({
      queryKey: orpcQueryClient.authed.mcp.getMCPServer.key({
        input: { id: serverId },
      }),
    });
  };

  const invalidateServerTools = () => {
    queryClient.invalidateQueries({
      queryKey: orpcQueryClient.authed.mcp.listMCPTools.key({
        input: { id: serverId },
      }),
    });
  };

  const invalidateServerResources = () => {
    queryClient.invalidateQueries({
      queryKey: orpcQueryClient.authed.mcp.listMCPResources.key({
        input: { id: serverId },
      }),
    });
  };

  const invalidateServerPrompts = () => {
    queryClient.invalidateQueries({
      queryKey: orpcQueryClient.authed.mcp.listMCPPrompts.key({
        input: { id: serverId },
      }),
    });
  };

  // Connect to MCP server
  const connectMCP = useMutation(
    orpcQueryClient.authed.mcp.connectMCP.mutationOptions({
      onSuccess: (data) => {
        if (showToasts) {
          if (data.success) {
            showSuccessToast({
              title: "Connected to server",
              position: "bottom-right",
              description: data.message || "Successfully connected",
            });
          } else {
            showErrorToast({
              title: "Connection failed",
              position: "bottom-right",
              description: data.message || "Failed to connect",
            });
          }
        }
        if (data.success) {
          onSuccess?.();
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to connect",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: (data) => {
        invalidateServers();
        invalidateServer();
        if (data?.success) {
          invalidateServerTools();
          invalidateServerResources();
          invalidateServerPrompts();
        }
      },
    })
  );

  // Disconnect from MCP server
  const disconnectMCP = useMutation(
    orpcQueryClient.authed.mcp.disconnectMCP.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && data.success) {
          showSuccessToast({
            title: "Disconnected from server",
            position: "bottom-right",
            description: "Successfully disconnected",
          });
        }
        if (data.success) {
          onSuccess?.();
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to disconnect",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: () => {
        invalidateServers();
        invalidateServer();
      },
    })
  );

  // Read MCP resource
  const readMCPResource = useMutation(
    orpcQueryClient.authed.mcp.readMCPResource.mutationOptions({
      onSuccess: (data) => {
        if (showToasts) {
          if (data.success) {
            showSuccessToast({
              title: "Resource read",
              position: "bottom-right",
              description: data.message || "Resource read successfully",
            });
          } else if (data.message) {
            showErrorToast({
              title: "Failed to read resource",
              position: "bottom-right",
              description: data.message,
            });
          }
        }
        if (data.success) {
          onSuccess?.();
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to read resource",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
    })
  );

  // Get MCP prompt
  const getMCPPrompt = useMutation(
    orpcQueryClient.authed.mcp.getMCPPrompt.mutationOptions({
      onSuccess: (data) => {
        if (showToasts) {
          if (data.success) {
            showSuccessToast({
              title: "Prompt retrieved",
              position: "bottom-right",
              description: data.message || "Prompt retrieved successfully",
            });
          } else if (data.message) {
            showErrorToast({
              title: "Failed to get prompt",
              position: "bottom-right",
              description: data.message,
            });
          }
        }
        if (data.success) {
          onSuccess?.();
        }
      },
      onError: (error) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to get prompt",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
    })
  );

  const server = serverResponse?.server;
  const tools = toolsResponse?.tools || [];
  const resources = resourcesResponse?.resources || [];
  const prompts = promptsResponse?.prompts || [];

  return {
    // Data
    server,
    tools,
    resources,
    prompts,
    serverId,

    // Loading states
    isLoadingServer,
    isLoadingTools,
    isLoadingResources,
    isLoadingPrompts,

    // Error states
    isServerError,
    isToolsError,
    isResourcesError,
    isPromptsError,
    serverError,
    toolsError,
    resourcesError,
    promptsError,

    // Connection mutations
    connectMCP: {
      mutate: connectMCP.mutate,
      mutateAsync: connectMCP.mutateAsync,
      isPending: connectMCP.isPending,
      isError: connectMCP.isError,
      error: connectMCP.error,
      data: connectMCP.data,
    },
    disconnectMCP: {
      mutate: disconnectMCP.mutate,
      mutateAsync: disconnectMCP.mutateAsync,
      isPending: disconnectMCP.isPending,
      isError: disconnectMCP.isError,
      error: disconnectMCP.error,
    },

    // Operation mutations
    readMCPResource: {
      mutate: readMCPResource.mutate,
      mutateAsync: readMCPResource.mutateAsync,
      isPending: readMCPResource.isPending,
      isError: readMCPResource.isError,
      error: readMCPResource.error,
      data: readMCPResource.data,
    },
    getMCPPrompt: {
      mutate: getMCPPrompt.mutate,
      mutateAsync: getMCPPrompt.mutateAsync,
      isPending: getMCPPrompt.isPending,
      isError: getMCPPrompt.isError,
      error: getMCPPrompt.error,
      data: getMCPPrompt.data,
    },

    // Invalidation helpers
    invalidateServers,
    invalidateServer,
    invalidateServerTools,
    invalidateServerResources,
    invalidateServerPrompts,
  };
};
