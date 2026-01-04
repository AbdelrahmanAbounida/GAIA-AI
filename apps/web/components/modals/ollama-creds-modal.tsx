import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCredentials } from "@/hooks/use-credentials";
import { useOllama } from "@/hooks/use-ollama";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { DialogTrigger } from "@radix-ui/react-dialog";

interface CreateOllamaCredentialModalProps {
  credentialType: "ai_model" | "embedding";
}

// configure baseurl , and apikey
export function CreateOllamaCredentialModal({
  credentialType,
}: CreateOllamaCredentialModalProps) {
  const {
    isLoading: credentialsLoading,
    credentials,
    createMutation,
    updateMutation,
  } = useCredentials();
  const { testConnection, refetchModels } = useOllama();
  const [open, setOpen] = useState(false);

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const ollamaCred = credentials.find(
    (cred) =>
      cred.provider === "ollama" && cred.credentialType === credentialType
  );
  const isUpdate = !!ollamaCred;

  // Load existing credentials when modal opens
  useEffect(() => {
    if (open && ollamaCred) {
      setBaseUrl(ollamaCred.baseUrl || "");
      setApiKey(ollamaCred.apiKey || "");
    } else if (open && !ollamaCred) {
      setBaseUrl("http://localhost:11434");
      setApiKey("");
    }
  }, [open, ollamaCred]);

  const handleClose = () => {
    setBaseUrl("");
    setApiKey("");
    setShowApiKey(false);
    setOpen(false);
  };

  const handleSave = async () => {
    if (!baseUrl.trim()) {
      showErrorToast({
        title: "Validation Error",
        description: "Base URL is required",
        duration: 3000,
      });
      return;
    }

    setIsValidating(true);

    try {
      // Test connection before saving with the new credentials
      const connectionResult = await testConnection.mutateAsync({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
      });

      if (!connectionResult?.connected) {
        showErrorToast({
          title: "Connection Failed",
          description:
            "Unable to connect to Ollama. Please check your base URL and try again.",
          duration: 4000,
        });
        setIsValidating(false);
        return;
      }

      // Create or update credential
      if (isUpdate) {
        const res = await updateMutation.mutateAsync({
          data: {
            baseUrl: baseUrl.trim(),
            apiKey: apiKey.trim(),
            provider: "ollama",
            credentialType: credentialType,
          },
          id: ollamaCred.id,
        });
      } else {
        await createMutation.mutateAsync({
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
          provider: "ollama",
          credentialType: credentialType,
        });
      }

      await refetchModels();
      showSuccessToast({
        title: "Success",
        description: `Ollama credentials ${isUpdate ? "updated" : "created"} successfully`,
        duration: 3000,
      });

      handleClose();
    } catch (err: any) {
      showErrorToast({
        title: "Error",
        description:
          err?.message ||
          `Failed to ${isUpdate ? "update" : "create"} credentials`,
        duration: 4000,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isLoading = credentialsLoading || isValidating || isSaving;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>
        <Button size={"icon"} variant={"outline"} className="size-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isUpdate
              ? "Update Ollama Credentials"
              : "Configure Ollama Connection"}
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update your Ollama connection settings and API key."
              : "Connect to your Ollama instance to access local AI models."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="base-url">
              Base URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="base-url"
              placeholder="http://localhost:11434"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              The URL where your Ollama instance is running
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key (Optional)</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter API key if required"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowApiKey(!showApiKey)}
                disabled={isLoading}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty if your Ollama instance doesn't require authentication
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size={"sm"}
            className="px-7"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={"brand"}
            size={"sm"}
            className="px-7"
            onClick={handleSave}
            disabled={isLoading || !baseUrl.trim()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isValidating
              ? "Validating..."
              : isSaving
                ? "Saving..."
                : isUpdate
                  ? "Update"
                  : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
