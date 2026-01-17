import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { maskApiKey } from "@/lib/utils";

export function useCredentials(refetchIntervalSeconds?: number) {
  const queryClient = useQueryClient();

  const {
    data: credentialsData,
    isLoading,
    refetch,
  } = useQuery({
    ...orpcQueryClient.authed.credentials.list.queryOptions({
      input: { offset: 0, limit: 100 },
    }),
    refetchInterval: refetchIntervalSeconds
      ? refetchIntervalSeconds * 1000
      : false,
  });

  const credentials = credentialsData?.credentials || [];
  const aiCredentials = credentials.filter(
    (c) => c.credentialType === "ai_model"
  );

  const createMutation = useMutation({
    ...orpcQueryClient.authed.credentials.create.mutationOptions({}),
    onMutate: async (newCredential) => {
      await queryClient.cancelQueries({
        queryKey: orpcQueryClient.authed.credentials.list.queryKey({
          input: { offset: 0, limit: 100 },
        }),
      });

      const previousCredentials = queryClient.getQueryData(
        orpcQueryClient.authed.credentials.list.queryKey({
          input: { offset: 0, limit: 100 },
        })
      );

      queryClient.setQueryData(
        orpcQueryClient.authed.credentials.list.queryKey({
          input: { offset: 0, limit: 100 },
        }),
        (old: any) => {
          if (!old) return old;

          // For Ollama, update existing credential or add new one
          if (newCredential.provider === "ollama") {
            const existingOllamaIndex = old.credentials.findIndex(
              (c: any) =>
                c.provider === "ollama" &&
                c.credentialType === newCredential.credentialType
            );

            if (existingOllamaIndex !== -1) {
              const existingCred = old.credentials[existingOllamaIndex];
              const existingModels = (existingCred.models as string[]) || [];
              const updatedModels = newCredential.name
                ? [...existingModels, newCredential.name]
                : existingModels;

              const updatedCredentials = [...old.credentials];
              updatedCredentials[existingOllamaIndex] = {
                ...existingCred,
                models: updatedModels,
                updatedAt: new Date().toISOString(),
              };

              return {
                ...old,
                credentials: updatedCredentials,
              };
            }
          }

          return {
            ...old,
            credentials: [
              ...(old.credentials || []),
              {
                id: crypto.randomUUID(),
                provider: newCredential.provider,
                proxy: newCredential.proxy,
                apiKey: newCredential.apiKey,
                maskedApiKey: maskApiKey(newCredential.apiKey || ""),
                baseUrl: newCredential.baseUrl,
                models: newCredential.name ? [newCredential.name] : [],
                isValid: true,
                credentialType: newCredential.credentialType,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
      );

      return { previousCredentials };
    },
    onSuccess: (data) => {
      if (!data.success) {
        showErrorToast({
          title: "Failed to save credential",
          position: "bottom-right",
          description: data.message || "Something went wrong",
        });
        return;
      }

      showSuccessToast({
        title: "Success",
        description: data.message || "Credential saved successfully",
        position: "bottom-right",
      });
    },
    onError: (error, newCredential, context) => {
      if (context?.previousCredentials) {
        queryClient.setQueryData(
          orpcQueryClient.authed.credentials.list.queryKey({
            input: { offset: 0, limit: 100 },
          }),
          context.previousCredentials
        );
      }
      showErrorToast({
        title: "Failed to save credential",
        position: "bottom-right",
        description: error.message || "Something went wrong",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.credentials.list.queryKey({
          input: { offset: 0, limit: 100 },
        }),
      });
    },
  });

  const updateMutation = useMutation({
    ...orpcQueryClient.authed.credentials.update.mutationOptions({}),
    onSuccess: (data) => {
      if (data.success) {
        showSuccessToast({
          title: "Success",
          description: data.message,
          position: "bottom-right",
        });
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.credentials.list.queryKey({
            input: { offset: 0, limit: 100 },
          }),
        });
      } else {
        showErrorToast({
          title: "Update failed",
          description: data.message,
          position: "bottom-right",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    ...orpcQueryClient.authed.credentials.delete.mutationOptions({}),
    onSuccess: (data) => {
      if (data.success) {
        showSuccessToast({
          title: "Success",
          description: data.message,
          position: "bottom-right",
        });
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.credentials.list.key(),
        });
      } else {
        showErrorToast({
          title: "Delete failed",
          description: data.message,
          position: "bottom-right",
        });
      }
    },
    onError: (error) => {
      showErrorToast({
        title: "Failed to delete credential",
        position: "bottom-right",
        description: error.message || "Something went wrong",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.credentials.list.key(),
      });
    },
  });

  const deleteModelMutation = useMutation({
    ...orpcQueryClient.authed.credentials.deleteModelFromCredential.mutationOptions(
      {}
    ),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: orpcQueryClient.authed.credentials.list.queryKey({
          input: { offset: 0, limit: 100 },
        }),
      });

      const previousCredentials = queryClient.getQueryData(
        orpcQueryClient.authed.credentials.list.queryKey({
          input: { offset: 0, limit: 100 },
        })
      );

      queryClient.setQueryData(
        orpcQueryClient.authed.credentials.list.queryKey({
          input: { offset: 0, limit: 100 },
        }),
        (old: any) => {
          if (!old) return old;

          const updatedCredentials = old.credentials
            .map((cred: any) => {
              if (cred.id === variables.id) {
                const updatedModels = (cred.models as string[]).filter(
                  (m: string) => m !== variables.modelName
                );

                // If no models left, filter out the credential
                if (updatedModels.length === 0) {
                  return null;
                }

                return {
                  ...cred,
                  models: updatedModels,
                  updatedAt: new Date().toISOString(),
                };
              }
              return cred;
            })
            .filter(Boolean);

          return {
            ...old,
            credentials: updatedCredentials,
          };
        }
      );

      return { previousCredentials };
    },
    onSuccess: (data) => {
      if (data.success) {
        showSuccessToast({
          title: "Success",
          description: data.message,
          position: "bottom-right",
        });
      }
    },
    onError: (error, variables, context) => {
      if (context?.previousCredentials) {
        queryClient.setQueryData(
          orpcQueryClient.authed.credentials.list.queryKey({
            input: { offset: 0, limit: 100 },
          }),
          context.previousCredentials
        );
      }
      showErrorToast({
        title: "Failed to delete model",
        position: "bottom-right",
        description: error.message || "Something went wrong",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.credentials.list.queryKey({
          input: { offset: 0, limit: 100 },
        }),
      });
    },
  });

  return {
    credentials,
    aiCredentials,
    isLoading,
    refetch,
    createMutation,
    updateMutation,
    deleteMutation,
    deleteModelMutation,
  };
}
