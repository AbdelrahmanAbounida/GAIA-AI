import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import {
  PullProgress,
  useOllamaPullStore,
} from "@/store/use-ollama-pull-store";
import { useCallback, useEffect, useRef } from "react";
import { useCredentials } from "./use-credentials";

interface InstalledModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: any;
}

function getDefaultOllamaBaseUrl(): string {
  const isDocker =
    process.env.NEXT_PUBLIC_DOCKER_ENV === "true" ||
    process.env.NEXT_PUBLIC_IS_DOCKER === "true" ||
    process.env.NEXT_PUBLIC_DOCKER === "true";

  return isDocker
    ? "http://host.docker.internal:11434"
    : "http://localhost:11434";
}

export function useOllama() {
  const { credentials } = useCredentials();
  const ollamaCred = credentials.find((cred) => cred.provider === "ollama");

  // Prioritize Docker URL if in Docker environment and saved URL is localhost
  const isDocker =
    process.env.NEXT_PUBLIC_DOCKER_ENV === "true" ||
    process.env.NEXT_PUBLIC_IS_DOCKER === "true" ||
    process.env.NEXT_PUBLIC_DOCKER === "true";

  let baseUrl = ollamaCred?.baseUrl || getDefaultOllamaBaseUrl();

  // Override localhost with Docker URL if in Docker
  if (isDocker && baseUrl.includes("localhost")) {
    baseUrl = "http://host.docker.internal:11434";
  }

  const {
    isOllamaRunning,
    connectionChecking,
    checkConnection,
    testConnection,
  } = useOllamaConnection(baseUrl);

  const {
    installedModels,
    isLoading,
    isRefetching,
    refetchModels,
    deleteModel,
    searchModels,
    getModelDetails,
    showModel,
  } = useOllamaModels(baseUrl);

  const { pullModel, cancelPull, activePulls, isPulling, getPullProgress } =
    useOllamaPull(baseUrl);

  return {
    isOllamaRunning,
    connectionChecking,
    checkConnection,
    testConnection,
    baseUrl,
    installedModels,
    isLoading,
    isRefetching,
    refetchModels,
    deleteModel,
    searchModels,
    showModel, // LEGACY
    getModelDetails,
    pullModel,
    cancelPull,
    activePulls,
    isPulling,
    getPullProgress,
  };
}

export function useOllamaModels(baseUrl?: string) {
  const queryClient = useQueryClient();
  const { credentials } = useCredentials();
  const ollamaCred = credentials.find((cred) => cred.provider === "ollama");

  const isDocker =
    process.env.NEXT_PUBLIC_DOCKER_ENV === "true" ||
    process.env.NEXT_PUBLIC_IS_DOCKER === "true" ||
    process.env.NEXT_PUBLIC_DOCKER === "true";

  let finalBaseUrl =
    baseUrl || ollamaCred?.baseUrl || getDefaultOllamaBaseUrl();

  // Override localhost with Docker URL if in Docker
  if (isDocker && finalBaseUrl.includes("localhost")) {
    finalBaseUrl = "http://host.docker.internal:11434";
  }

  const {
    data: modelsData,
    isPending: isLoading,
    refetch: refetchModels,
    isFetching: isRefetching,
  } = useQuery({
    ...orpcQueryClient.authed.ollama.listModels.queryOptions({
      input: { baseUrl: finalBaseUrl },
    }),
    refetchInterval: 30000,
    retry: false,
  });

  const installedModels: InstalledModel[] = modelsData?.models || [];

  const deleteModelMutation = useMutation({
    ...orpcQueryClient.authed.ollama.deleteModel.mutationOptions(),
    onSuccess: (data, variables) => {
      const modelName =
        typeof variables === "string"
          ? variables
          : (variables as any)?.modelName;

      if (!data?.success) {
        showErrorToast({
          title: "Delete Failed",
          description: data?.error || "Failed to delete model",
          position: "bottom-right",
        });
        return;
      }

      showSuccessToast({
        title: "Model Deleted",
        description: `${modelName} has been removed`,
        position: "bottom-right",
      });

      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.ollama.listModels.queryKey({
          input: { baseUrl: finalBaseUrl },
        }),
      });
    },
  });

  const searchModelsMutation = useMutation({
    ...orpcQueryClient.authed.ollama.searchForModel.mutationOptions(),
  });

  const searchModelDetailsMutation = useMutation({
    ...orpcQueryClient.authed.ollama.getModelDetails.mutationOptions(),
  });

  const showModelMutation = useMutation({
    ...orpcQueryClient.authed.ollama.showModel.mutationOptions(),
  });

  return {
    installedModels,
    isLoading,
    isRefetching,
    refetchModels,
    deleteModel: deleteModelMutation,
    searchModels: searchModelsMutation,
    getModelDetails: searchModelDetailsMutation,
    showModel: showModelMutation,
  };
}

export function useOllamaConnection(baseUrl?: string) {
  const { credentials } = useCredentials();
  const ollamaCred = credentials.find((cred) => cred.provider === "ollama");

  const isDocker =
    process.env.NEXT_PUBLIC_DOCKER_ENV === "true" ||
    process.env.NEXT_PUBLIC_IS_DOCKER === "true" ||
    process.env.NEXT_PUBLIC_DOCKER === "true";

  let finalBaseUrl =
    baseUrl || ollamaCred?.baseUrl || getDefaultOllamaBaseUrl();

  // Override localhost with Docker URL if in Docker
  if (isDocker && finalBaseUrl.includes("localhost")) {
    finalBaseUrl = "http://host.docker.internal:11434";
  }

  const {
    data: connectionStatus,
    isPending: connectionLoading,
    refetch: checkConnection,
  } = useQuery({
    ...orpcQueryClient.authed.ollama.checkConnection.queryOptions({
      input: { baseUrl: finalBaseUrl },
    }),
    refetchInterval: 10000,
  });

  const testConnectionMutation = useMutation({
    ...orpcQueryClient.authed.ollama.checkConnection.mutationOptions(),
  });

  useEffect(() => {
    if (!connectionLoading && connectionStatus && !connectionStatus.connected) {
      showErrorToast({
        title: "Ollama Not Running",
        description: "Please start Ollama to use local models",
        position: "bottom-right",
      });
    }
  }, [connectionStatus?.connected, connectionLoading]);

  return {
    isOllamaRunning: connectionStatus?.connected ?? false,
    connectionChecking: connectionLoading,
    checkConnection,
    testConnection: testConnectionMutation,
  };
}

interface UseOllamaPullReturn {
  pullModel: (modelName: string) => Promise<void>;
  cancelPull: (modelName: string) => void;
  activePulls: PullProgress[];
  isPulling: boolean;
  getPullProgress: (modelName: string) => PullProgress | undefined;
}

export const useOllamaPull = (baseUrl?: string): UseOllamaPullReturn => {
  const { activePulls, addPull, updatePull, removePull, getPull } =
    useOllamaPullStore();
  const { deleteModel } = useOllamaModels(baseUrl);
  const { credentials } = useCredentials();
  const ollamaCred = credentials.find((cred) => cred.provider === "ollama");

  const isDocker =
    process.env.NEXT_PUBLIC_DOCKER_ENV === "true" ||
    process.env.NEXT_PUBLIC_IS_DOCKER === "true" ||
    process.env.NEXT_PUBLIC_DOCKER === "true";

  let OLLAMA_BASE_URL =
    baseUrl || ollamaCred?.baseUrl || getDefaultOllamaBaseUrl();

  // Override localhost with Docker URL if in Docker
  if (isDocker && OLLAMA_BASE_URL.includes("localhost")) {
    OLLAMA_BASE_URL = "http://host.docker.internal:11434";
  }

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    activePulls.forEach((pull) => {
      if (pull.status !== "complete" && pull.status !== "cancelled") {
        if (!abortControllersRef.current.has(pull.modelName)) {
          resumePull(pull.modelName);
        }
      }
    });
  }, []);

  const resumePull = async (modelName: string) => {
    const controller = new AbortController();
    abortControllersRef.current.set(modelName, controller);

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modelName, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            let progress = 0;
            let status = data.status || "pulling";

            if (data.completed && data.total) {
              progress = (data.completed / data.total) * 100;
            } else if (
              status.includes("success") ||
              status.includes("complete")
            ) {
              progress = 100;
              status = "complete";
            } else if (
              status.includes("extracting") ||
              status.includes("verifying")
            ) {
              progress = Math.max(getPull(modelName)?.progress || 0, 95);
              status = "extracting";
            }

            updatePull(modelName, {
              progress,
              status,
              total: data.total,
              completed: data.completed,
            });

            if (status === "complete") {
              setTimeout(() => removePull(modelName), 2000);
            }
          } catch (parseError) {
            console.error("Failed to parse pull progress:", parseError);
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        updatePull(modelName, {
          status: "cancelled",
          error: "Download cancelled",
        });
        try {
          await deleteModel.mutateAsync({
            modelName,
            baseUrl: OLLAMA_BASE_URL,
          });
        } catch (e) {
          console.log(e);
        }
        removePull(modelName);
      } else {
        updatePull(modelName, {
          status: "error",
          error: (error as Error).message,
        });
      }
    } finally {
      abortControllersRef.current.delete(modelName);
    }
  };

  const pullModel = useCallback(
    async (modelName: string): Promise<void> => {
      const existingPull = getPull(modelName);
      if (
        existingPull &&
        existingPull.status !== "complete" &&
        existingPull.status !== "error"
      ) {
        return;
      }

      addPull(modelName);
      await resumePull(modelName);
    },
    [addPull, getPull]
  );

  const cancelPull = useCallback(
    async (modelName: string) => {
      const controller = abortControllersRef.current.get(modelName);
      if (controller) {
        controller.abort();
      } else {
        removePull(modelName);
      }

      try {
        await deleteModel.mutateAsync({
          modelName,
          baseUrl: OLLAMA_BASE_URL,
        });
      } catch (e) {
        console.log(e);
      }
    },
    [removePull, deleteModel, OLLAMA_BASE_URL]
  );

  const getPullProgress = useCallback(
    (modelName: string): PullProgress | undefined => {
      return getPull(modelName);
    },
    [getPull]
  );

  return {
    pullModel,
    cancelPull,
    activePulls,
    isPulling: activePulls.some(
      (p) => p.status !== "complete" && p.status !== "error"
    ),
    getPullProgress,
  };
};
