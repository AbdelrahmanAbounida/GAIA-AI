import { showErrorToast } from "@/components/ui/toast";
import { useCredentials } from "@/hooks/use-credentials";
import { useOllama } from "@/hooks/use-ollama";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoxIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateOllamaCredentialModal } from "../../ollama-creds-modal";

export const MainTabs = ({ view }: { view: "ai_models" | "embeddings" }) => {
  const {
    connectionChecking,
    checkConnection,
    isLoading: modelsLoading,
    refetchModels,
    isRefetching: modelsRefetching,
  } = useOllama();

  const handleRefresh = async () => {
    try {
      await Promise.all([checkConnection(), refetchModels()]);
    } catch (err: any) {
      showErrorToast({
        title: "Error",
        description: err?.message || "Failed to refresh models",
        duration: 4000,
      });
    }
  };
  const { isLoading: credentialsLoading } = useCredentials();
  const isLoadingCredentialsOrModels =
    credentialsLoading || modelsLoading || modelsRefetching;

  return (
    <div className="w-full flex items-center justify-between mb-6">
      <TabsList>
        <TabsTrigger value="all">
          <BoxIcon className="h-4 w-4 mr-2" />
          All Models
        </TabsTrigger>
        <TabsTrigger value="ollama">
          <img
            src="/icons/ollama.png"
            className="size-4 mr-2 hidden dark:block"
            alt="ollama"
            width={16}
            height={16}
          />
          <img
            src="/icons/ollama.svg"
            className="size-4 mr-2  dark:hidden"
            alt="ollama"
            width={16}
            height={16}
          />
          Ollama
        </TabsTrigger>
        <TabsTrigger value="openai-compatible">
          <img
            src="/icons/openai.png"
            alt="openai"
            className="size-3.5 mr-2 hidden dark:block"
            width={14}
            height={14}
          />
          <img
            src="/icons/openai.svg"
            alt="openai"
            className="size-3.5 mr-2 dark:hidden"
            width={14}
            height={14}
          />
          OpenAI Compatible
        </TabsTrigger>
      </TabsList>

      <div className="flex items-center gap-2">
        <CreateOllamaCredentialModal
          credentialType={view == "ai_models" ? "ai_model" : "embedding"}
        />
        <Button
          variant="outline"
          size="icon"
          className="p-0! size-8"
          onClick={handleRefresh}
          disabled={isLoadingCredentialsOrModels || connectionChecking}
        >
          <RefreshCw
            className={cn(
              "size-3.5! ",
              (isLoadingCredentialsOrModels || connectionChecking) &&
                "animate-spin"
            )}
          />
        </Button>
      </div>
    </div>
  );
};

// Add modal for ollama baseurl form and test if it is correct using ollama api
