import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, Loader2, PlusIcon } from "lucide-react";
import { useCredentials } from "@/hooks/use-credentials";
import { useLocalModelStore } from "@/store/use-local-models";
import { validateURL } from "@/lib/utils";
import { showErrorToast } from "@/components/ui/toast";
import { Label } from "@/components/ui/label";

export const OpenAICompatibleView = () => {
  // tabs
  const setActiveTab = useLocalModelStore((s) => s.setCurrentActiveTab);

  // openai compatible
  const openaiName = useLocalModelStore((s) => s.openaiName);
  const setOpenaiName = useLocalModelStore((s) => s.setOpenaiName);
  const openaiUrl = useLocalModelStore((s) => s.openaiUrl);
  const setOpenaiUrl = useLocalModelStore((s) => s.setOpenaiUrl);
  const openaiKey = useLocalModelStore((s) => s.openaiKey);
  const setOpenaiKey = useLocalModelStore((s) => s.setOpenaiKey);
  const showPassword = useLocalModelStore((s) => s.showPassword);
  const setShowPassword = useLocalModelStore((s) => s.setShowPassword);
  const addingOpenAICompatible = useLocalModelStore(
    (s) => s.addingOpenAICompatible
  );
  const setAddingOpenAICompatible = useLocalModelStore(
    (s) => s.setAddingOpenAICompatible
  );

  const { createMutation: createCredentialMutation } = useCredentials();

  const validateOpenAICompatible = async (
    openaiUrl: string,
    openaiKey: string
  ) => {
    try {
      if (!validateURL(openaiUrl.trim())) {
        showErrorToast({
          title: "Invalid URL",
          description: "Please enter a valid URL.",
          position: "bottom-right",
          duration: 4000,
        });
        return;
      }
      const res = await fetch("/api/validate-openai-compatible", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: openaiName,
          url: openaiUrl,
          apiKey: openaiKey,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        let errorTitle = "Validation Failed";
        let errorMessage = data.message;

        if (data.statusCode === 401) {
          errorTitle = "Invalid API Key";
          errorMessage = "The API key provided is invalid or expired";
        } else if (data.statusCode === 403) {
          errorTitle = "Access Forbidden";
          errorMessage = "You don't have permission to access this API";
        } else if (data.statusCode === 404) {
          errorTitle = "Invalid URL";
          errorMessage =
            "The connection failed to this api endpoint. Please check the URL";
        }

        showErrorToast({
          title: errorTitle,
          description: errorMessage,
          duration: 6000,
          position: "bottom-right",
        });
        return false;
      }
      return true;
    } catch (error) {
      showErrorToast({
        title: "Connection Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to validate OpenAI compatible model",
        duration: 6000,
        position: "bottom-right",
      });
      return false;
    }
  };
  const handleAddOpenAI = async () => {
    setAddingOpenAICompatible(true);

    if (!openaiName.trim() || !openaiUrl.trim()) {
      showErrorToast({
        title: "Missing Fields",
        description: "Name and URL are required.",
        position: "bottom-right",
        duration: 4000,
      });
      setAddingOpenAICompatible(false);
      return;
    }

    try {
      const isValid = await validateOpenAICompatible(openaiUrl, openaiKey);
      if (!isValid) {
        setAddingOpenAICompatible(false);
        return;
      }
      const data = await createCredentialMutation.mutateAsync({
        provider: "openai-compatible",
        credentialType: "ai_model",
        name: openaiName.trim(),
        baseUrl: openaiUrl.trim(),
        apiKey: openaiKey.trim() || "",
        isValid: true,
      });

      if (!data?.success) {
        showErrorToast({
          title: "Error",
          description: data?.message || "Something went wrong",
          duration: 4000,
          position: "bottom-right",
        });
        return;
      }

      setOpenaiName("");
      setOpenaiUrl("");
      setOpenaiKey("");
      setActiveTab("all");
    } catch (error) {
      console.error("Error adding OpenAI compatible model:", error);
      showErrorToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add OpenAI compatible model",
        duration: 4000,
        position: "bottom-right",
      });
    } finally {
      setAddingOpenAICompatible(false);
    }
  };

  return (
    <div className="glass-panel rounded-lg p-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="openai-name" className="text-sm">
          Display name
        </Label>
        <Input
          id="openai-name"
          placeholder="e.g., GPT-4 Turbo"
          value={openaiName}
          onChange={(e) => setOpenaiName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="openai-url" className="text-sm">
          Base URL
        </Label>
        <Input
          id="openai-url"
          placeholder="https://api.openai.com/v1"
          value={openaiUrl}
          onChange={(e) => setOpenaiUrl(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="openai-key" className="text-sm">
          API Key <span className="text-muted-foreground">(optional)</span>
        </Label>
        <div className="relative w-full">
          <Input
            id="openai-key"
            type={showPassword ? "text" : "password"}
            placeholder="sk-..."
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            className="font-mono text-sm pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" size="sm" onClick={() => setActiveTab("all")}>
          Cancel
        </Button>
        <Button
          variant="brand"
          size="sm"
          onClick={handleAddOpenAI}
          disabled={
            !openaiName.trim() ||
            !openaiUrl.trim() ||
            createCredentialMutation.isPending ||
            addingOpenAICompatible
          }
        >
          {createCredentialMutation.isPending || addingOpenAICompatible ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <PlusIcon className="w-4 h-4 mr-2" />
          )}
          Add Model
        </Button>
      </div>
    </div>
  );
};
