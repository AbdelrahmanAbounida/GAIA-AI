import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useOllama } from "@/hooks/use-ollama";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const MainAlerts = () => {
  const { isOllamaRunning, connectionChecking } = useOllama();
  return (
    <>
      {!connectionChecking && !isOllamaRunning && (
        <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm flex items-center justify-between">
            <span>
              Ollama is not running. Please start Ollama to download models.
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="ml-4 shrink-0"
            >
              <a
                href="https://ollama.com/download"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Ollama
                <ExternalLink className="w-3 h-3 ml-2" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {connectionChecking && (
        <Alert className="mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-sm">
            Checking Ollama connection...
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
