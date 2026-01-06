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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ProviderIcon } from "./provider-icons";
import {
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Info,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { maskApiKey } from "@/lib/utils";
import { useAvailableModels } from "@/hooks/use-availabele-models";
import { PROVIDER_CONFIGS } from "@gaia/ai/const";
import type { AIProvider } from "@gaia/ai/types";
import { useCredentials } from "@/hooks/use-credentials";
import { ConfirmModal } from "../confirm-modal";

interface ProviderSetupFormProps {
  provider: AIProvider;
  mode: "ai" | "embedding";
}

export function ProviderSetupForm({ provider, mode }: ProviderSetupFormProps) {
  const queryClient = useQueryClient();
  const { aiCredentials } = useAvailableModels();
  const { deleteMutation, updateMutation } = useCredentials(100);

  // Find the matching provider config
  const providerConfig = useMemo(() => {
    return PROVIDER_CONFIGS.find(
      (config) => config.id.toLowerCase() === provider.name.toLowerCase()
    );
  }, [provider.name]);

  const existingCredential = useMemo(() => {
    return aiCredentials?.find(
      (cred) =>
        cred.provider.toLowerCase()?.includes(provider.name.toLowerCase()) &&
        cred.credentialType === "ai_model"
    );
  }, [aiCredentials, provider.name]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Initialize form data with defaults
  useEffect(() => {
    if (providerConfig) {
      const defaultData: Record<string, string> = {};

      // Set baseUrl if available
      if (providerConfig.baseUrl) {
        defaultData.baseUrl =
          existingCredential?.baseUrl || providerConfig.baseUrl;
      }

      // set apiKey if available
      if (existingCredential?.apiKey) {
        defaultData.apiKey = existingCredential.apiKey;
      }

      // set proxy if available
      if (existingCredential?.proxy) {
        defaultData.proxy = existingCredential.proxy;
      }

      providerConfig.fields.forEach((field) => {
        if (existingCredential && field.id === "baseUrl") {
          defaultData[field.id] = existingCredential.baseUrl || "";
        }
      });

      setFormData(defaultData);
    }
    setTestResult(null);
  }, [provider, existingCredential, providerConfig]);

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
        })
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
                proxy: newCredential.proxy,
                apiKey: newCredential.apiKey,
                maskedApiKey: maskApiKey(newCredential.apiKey || ""),
                baseUrl: newCredential.baseUrl,
                isValid: true,
                credentialType: "ai_model",
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
        description: data.message || "Provider configured successfully",
        position: "bottom-right",
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
          input: {
            offset: 0,
            limit: 20,
          },
        }),
      });
    },
  });

  const validateFields = () => {
    if (!providerConfig) return false;
    return providerConfig.fields
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

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.name,
          credentialType: "ai_model",
          ...formData,
        }),
      });

      const { isValid, message } = await res.json();

      if (!isValid) {
        showErrorToast({
          title: "Invalid Credentials",
          position: "bottom-right",
          description: message || "The provided credentials are invalid",
        });
        return;
      }

      // check if existhting this update
      if (existingCredential) {
        updateMutation.mutate({
          id: existingCredential.id,
          data: {
            provider: provider.name,
            apiKey: formData.apiKey || "",
            baseUrl: formData.baseUrl || providerConfig?.baseUrl,
            isValid,
            credentialType: "ai_model",
            capabilities: provider.capabilities,
          },
        });
      } else {
        createMutation.mutate({
          provider: provider.name,
          apiKey: formData.apiKey || "",
          baseUrl: formData.baseUrl || providerConfig?.baseUrl,
          isValid,
          credentialType: "ai_model",
          capabilities: provider.capabilities,
        });
      }
    } catch (error) {
      showErrorToast({
        title: "Validation Failed",
        position: "bottom-right",
        description: "Could not validate credentials. Please try again.",
      });
    }
  };

  const handleDelete = () => {
    if (existingCredential) {
      deleteMutation.mutate({ id: existingCredential.id });
    }
  };

  const isValid = validateFields();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const hasEmbedding = provider.capabilities?.includes("embedding");

  if (!providerConfig) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configuration not found for {provider.name}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 h-full pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gaia-200 border border-gaia-300 dark:border-gaia-700 dark:bg-gaia-800 flex items-center justify-center">
            <ProviderIcon provider={provider.name} className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {provider.name}
              {mode === "embedding" && (
                <Badge variant="outline">Embedding</Badge>
              )}
              {/* {providerConfig.recommended && (
                <Badge variant="default">Recommended</Badge>
              )} */}
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure {provider.name} for{" "}
              {mode === "embedding" ? "embedding" : "AI"} models
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

      {/* Capabilities */}
      {provider.capabilities && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Capabilities:</span>
          {provider.capabilities.map((cap) => (
            <Badge key={cap} variant="outline" className="capitalize">
              {cap}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription>
            Enter your API credentials and settings for {provider.name}.
            {providerConfig.baseUrl && (
              <a
                href={providerConfig.apiKeyDocs}
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
          {providerConfig.fields.map((field) => (
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
                    field.type === "password" && !showSecrets[field.id]
                      ? "password"
                      : "text"
                  }
                  placeholder={field.placeholder || `Enter ${field.name}`}
                  value={formData[field.id] || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [field.id]: e.target.value })
                  }
                  className="pr-10"
                />
                {field.type === "password" && (
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

      {/* No Embedding Warning */}
      {mode === "ai" && !hasEmbedding && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {provider.name} doesn't provide embedding models. You'll need to
            configure a separate embedding provider to use RAG features.
          </AlertDescription>
        </Alert>
      )}

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription
            variant={testResult?.success ? "success" : "default"}
          >
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pb-4 w-fit ml-auto">
        <Button
          variant="brand"
          size="sm"
          onClick={handleSave}
          disabled={!isValid || isSubmitting} //|| !!existingCredential}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
          {existingCredential ? "Update Configuration" : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
