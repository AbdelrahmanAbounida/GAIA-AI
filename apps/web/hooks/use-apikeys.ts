import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { useEffect } from "react";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";

export function useApiKeys() {
  const queryClient = useQueryClient();

  const { data: apiKeysData, isPending: apiKeysLoading } = useQuery(
    orpcQueryClient.authed.apiKey.list.queryOptions({})
  );

  useEffect(() => {
    if (!apiKeysLoading && apiKeysData && !apiKeysData.success) {
      showErrorToast({
        title: "Failed to load API keys",
        description: "Something went wrong",
        position: "bottom-right",
      });
    }
  }, [apiKeysData, apiKeysLoading]);

  const apiKeys = apiKeysData?.apiKeys || [];

  // Get API key by ID
  const getApiKeyById = (id: string) => {
    return apiKeys.find((key) => key.id === id);
  };

  // Create mutation
  const createMutation = useMutation({
    ...orpcQueryClient.authed.apiKey.create.mutationOptions({}),
    onMutate: async (newApiKey) => {
      await queryClient.cancelQueries({
        queryKey: orpcQueryClient.authed.apiKey.list.queryKey({}),
      });

      const previousApiKeys = queryClient.getQueryData(
        orpcQueryClient.authed.apiKey.list.queryKey({})
      );

      queryClient.setQueryData(
        orpcQueryClient.authed.apiKey.list.queryKey({}),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            apiKeys: [
              ...(old.apiKeys || []),
              {
                id: crypto.randomUUID(),
                name: newApiKey.name,
                projectId: newApiKey.projectId,
                value: newApiKey.value,
                expiresAt: newApiKey.expiresAt || null,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
      );

      return { previousApiKeys };
    },
    onSuccess: (data) => {
      if (!data.success) {
        showErrorToast({
          title: "Failed to create API key",
          position: "bottom-right",
          description: data.message || "Something went wrong",
        });
        return;
      }

      showSuccessToast({
        title: "Success",
        description: data.message || "API key created successfully",
        position: "bottom-right",
      });
    },
    onError: (error, newApiKey, context) => {
      if (context?.previousApiKeys) {
        queryClient.setQueryData(
          orpcQueryClient.authed.apiKey.list.queryKey({}),
          context.previousApiKeys
        );
      }
      showErrorToast({
        title: "Failed to create API key",
        position: "bottom-right",
        description: error.message || "Something went wrong",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.apiKey.list.queryKey({}),
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    ...orpcQueryClient.authed.apiKey.delete.mutationOptions({}),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: orpcQueryClient.authed.apiKey.list.queryKey({}),
      });

      const previousApiKeys = queryClient.getQueryData(
        orpcQueryClient.authed.apiKey.list.queryKey({})
      );

      queryClient.setQueryData(
        orpcQueryClient.authed.apiKey.list.queryKey({}),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            apiKeys: old.apiKeys.filter((key: any) => key.id !== variables.id),
          };
        }
      );

      return { previousApiKeys };
    },
    onSuccess: (data) => {
      if (!data.success) {
        showErrorToast({
          title: "Failed to delete API key",
          position: "bottom-right",
          description: data.message || "Something went wrong",
        });
        return;
      }

      showSuccessToast({
        title: "Success",
        description: data.message || "API key deleted successfully",
        position: "bottom-right",
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousApiKeys) {
        queryClient.setQueryData(
          orpcQueryClient.authed.apiKey.list.queryKey({}),
          context.previousApiKeys
        );
      }
      showErrorToast({
        title: "Failed to delete API key",
        position: "bottom-right",
        description: error.message || "Something went wrong",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.apiKey.list.queryKey({}),
      });
    },
  });

  return {
    apiKeys,
    isPending: apiKeysLoading,
    getApiKeyById,
    createMutation,
    deleteMutation,
  };
}
