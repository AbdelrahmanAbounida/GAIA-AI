"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProviderIcon } from "./provider-icons";
import { Eye, EyeOff, Loader2, Trash2, ExternalLink } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { maskApiKey } from "@/lib/utils";
import { useAvailableModels } from "@/hooks/use-availabele-models";
import type { VectorStoreProvider } from "@gaia/ai";
import { PROVIDER_DOCS } from "@/const/docs";
import { ConfirmModal } from "../confirm-modal";
import { AlertMessage } from "@/components/alert-message";
import { useCurrentProjectId } from "@/hooks/use-projects";

interface VectorStoreSetupFormProps {
  vectorStore: VectorStoreProvider;
}

export function VectorStoreSetupForm({
  vectorStore,
}: VectorStoreSetupFormProps) {
  const queryClient = useQueryClient();
  const { vectorstoreCredentials } = useAvailableModels();

  const existingCredential = useMemo(() => {
    return vectorstoreCredentials?.find(
      (cred) =>
        cred.provider.toLowerCase() === vectorStore?.id?.toLowerCase() &&
        cred.credentialType === "vectorstore",
    );
  }, [vectorstoreCredentials, vectorStore?.id]);

  const { projectId } = useCurrentProjectId();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  const createMutation = useMutation({
    ...orpcQueryClient.authed.credentials.create.mutationOptions({}),
    onMutate: async (newCredential) => {
      await queryClient.cancelQueries({
        queryKey: orpcQueryClient.authed.credentials.list.queryKey({
          input: {
            offset: 0,
            limit: 20,
          },
        }),
      });

      const previousCredentials = queryClient.getQueryData(
        orpcQueryClient.authed.credentials.list.queryKey({
          input: {
            offset: 0,
            limit: 20,
          },
        }),
      );

      queryClient.setQueryData(
        orpcQueryClient.authed.credentials.list.queryKey({
          input: {
            offset: 0,
            limit: 20,
          },
        }),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            credentials: [
              ...(old.credentials || []),
              {
                id: crypto.randomUUID(),
                provider: newCredential.provider,
                maskedApiKey: maskApiKey(newCredential.apiKey || ""),
                isValid: true,
                credentialType: "vectorstore",
                createdAt: new Date().toISOString(),
              },
            ],
          };
        },
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
        setIsValidating(false);
        return;
      }

      showSuccessToast({
        title: "Success",
        description: data.message || "Vector store configured successfully",
        position: "bottom-left",
      });
    },
    onError: (error, newCredential, context) => {
      if (context?.previousCredentials) {
        queryClient.setQueryData(
          orpcQueryClient.authed.credentials.list.queryKey({
            input: {
              offset: 0,
              limit: 20,
            },
          }),
          context.previousCredentials,
        );
      }
      showErrorToast({
        title: "Failed to save credential",
        position: "bottom-right",
        description: error.message || "Something went wrong",
      });
      setIsValidating(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.credentials.list.queryKey({
          input: {
            offset: 0,
            limit: 20,
          },
        }),
      });
      setIsValidating(false);
    },
  });
  const validateAPIKeyMutation = useMutation(
    orpcQueryClient.authed.rag.validateVectorstoreConfig.mutationOptions({}),
  );

  const updateMutation = useMutation({
    ...orpcQueryClient.authed.credentials.update.mutationOptions({}),
    onSuccess: (data) => {
      if (data.success) {
        showSuccessToast({
          title: "Success",
          description: "Vector store credential updated successfully",
          position: "bottom-left",
        });
      }
    },
    onError: (error) => {
      showErrorToast({
        title: "Failed to update credential",
        position: "bottom-right",
        description: error.message || "Something went wrong",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.credentials.list.queryKey({
          input: {
            offset: 0,
            limit: 20,
          },
        }),
      });
    },
  });

  const deleteMutation = useMutation({
    ...orpcQueryClient.authed.credentials.delete.mutationOptions({}),
    onSuccess: (data) => {
      if (data.success) {
        showSuccessToast({
          title: "Success",
          description: "Vector store credential removed successfully",
          position: "bottom-left",
        });
      }
    },
    onError: (error) => {
      showErrorToast({
        title: "Failed to remove credential",
        position: "bottom-right",
        description: error.message || "Something went wrong",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.credentials.list.queryKey({
          input: {
            offset: 0,
            limit: 20,
          },
        }),
      });
    },
  });

  const validateFields = () => {
    if (vectorStore.credentials.length === 0) return true;
    return vectorStore.credentials
      .filter((field) => field.isRequired)
      .every((field) => formData[field.id]?.trim());
  };

  const handleSave = async () => {
    if (!validateFields()) {
      showErrorToast({
        title: "Validation Error",
        position: "bottom-right",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsValidating(true);
    try {
      const res = await validateAPIKeyMutation.mutateAsync({
        vectorstoreProvider: vectorStore.id,
        vectorStoreConfig: {
          apiKey: formData.apiKey || "",
          url: formData.url || formData.uri,
          collectionName: formData.collection || formData.collectionName || "",
          tenant: formData.tenant,
          address: formData.address,
          token: formData.token || "",
          username: formData.username,
          password: formData.password,
          enableFullTextSearch: !!formData.enableFullTextSearch || false,
          region: formData.region,
          database: formData.database,
          host: formData.host,
          port: formData.port,
          ssl: formData.ssl || false,
          tableName: formData.tableName,
        },
      });
      if (!res?.isValid) {
        showErrorToast({
          title: "Validation Failed",
          position: "bottom-left",
          duration: 10000,
          description:
            res?.message || "Could not validate credentials. Please try again.",
        });
        return;
      }

      if (existingCredential) {
        updateMutation.mutate({
          data: {
            provider: vectorStore.id,
            apiKey: formData.apiKey || "",
            isValid,
            credentialType: "vectorstore",
            dynamicFields: JSON.stringify(formData),
          },
          id: existingCredential.id,
        });
      } else {
        // Create new credential
        createMutation.mutate({
          provider: vectorStore.id,
          apiKey: formData.apiKey || "",
          isValid,
          credentialType: "vectorstore",
          dynamicFields: JSON.stringify(formData),
        });
      }
    } catch (error) {
      showErrorToast({
        title: "Validation Failed",
        position: "bottom-right",
        description: "Could not validate credentials. Please try again.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDelete = () => {
    if (existingCredential) {
      deleteMutation.mutate({ id: existingCredential.id });
    }
  };

  const isValid = validateFields();
  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || isValidating;
  const noCredentialsRequired = vectorStore.credentials.length === 0;

  useEffect(() => {
    if (vectorStore) {
      const dynamicFields = JSON.parse(
        (existingCredential?.dynamicFields as any) || "{}",
      ) as Record<string, any>;
      const defaultData: Record<string, string> = {};
      vectorStore.credentials?.forEach((field) => {
        defaultData[field.id] = dynamicFields[field.id] || "";
      });
      setFormData(defaultData);
    }
  }, [vectorStore?.id, existingCredential]);

  return (
    <div className="space-y-6 h-full pb-12">
      {/* Header */}
      <div className="flex items-start justify-between ">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gaia-200 border border-gaia-300 dark:border-gaia-700 dark:bg-gaia-800 flex items-center justify-center">
            <ProviderIcon provider={vectorStore.name} className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {vectorStore.name}
              {vectorStore.isLocalOnly && (
                <Badge variant="secondary">Local Only</Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {vectorStore.description}
            </p>
          </div>
        </div>

        {existingCredential && (
          <ConfirmModal
            className="w-fit"
            onDelete={handleDelete}
            isPending={deleteMutation.isPending}
          >
            <Button variant="ghost" size="icon" onClick={() => {}}>
              <Trash2 className="h-4 w-4  text-destructive" />
            </Button>
          </ConfirmModal>
        )}
      </div>

      <Separator />

      {/* Local Only Info */}
      {vectorStore.isLocalOnly && (
        <AlertMessage
          descClassName="text-[#6C99F2] font-normal"
          description="This is a local vector store that runs entirely on your machine. No external credentials are required."
        />
      )}

      {/* Configuration Card */}
      {!noCredentialsRequired && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription>
              Enter your credentials for {vectorStore.name}.
              {PROVIDER_DOCS[vectorStore.name] && (
                <a
                  href={PROVIDER_DOCS[vectorStore.name].apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-1 text-primary hover:underline"
                >
                  View docs <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vectorStore.credentials?.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="flex items-center gap-1">
                  {field.name}
                  {field.isRequired && (
                    <span className="text-destructive">*</span>
                  )}
                  {field.cloudOnly && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Cloud Only
                    </Badge>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id={field.id}
                    type={
                      field.isSecret && !showSecrets[field.id]
                        ? "password"
                        : "text"
                    }
                    placeholder={`Enter ${field.name}`}
                    value={formData[field.id] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.id]: e.target.value })
                    }
                    className={field.isSecret ? "pr-10" : ""}
                  />
                  {field.isSecret && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowSecrets({
                          ...showSecrets,
                          [field.id]: !showSecrets[field.id],
                        })
                      }
                    >
                      {showSecrets[field.id] ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {!noCredentialsRequired && (
        <div className="flex items-center gap-3  w-fit ml-auto pb-20">
          <Button
            variant="brand"
            size="sm"
            onClick={handleSave}
            disabled={
              (!isValid && !noCredentialsRequired) || isSubmitting
              // !!existingCredential
            }
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
            {existingCredential ? "Update Configuration" : "Save Configuration"}
          </Button>
        </div>
      )}
    </div>
  );
}
