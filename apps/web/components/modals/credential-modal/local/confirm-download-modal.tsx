import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { useCredentials } from "@/hooks/use-credentials";
import { useOllama } from "@/hooks/use-ollama";
import { useLocalModelStore } from "@/store/use-local-models";
import { CheckIcon, DownloadIcon } from "lucide-react";

export const ConfirmDownloadModal = () => {
  const confirmDialog = useLocalModelStore(
    (state) => state.confirmDownloadDialog
  );
  const setConfirmDialog = useLocalModelStore(
    (state) => state.setConfirmDownLoadModel
  );
  const { pullModel } = useOllama();
  const { createMutation: createCredentialMutation, credentials } =
    useCredentials();

  const ollamaCred = credentials.find((cred) => cred.provider === "ollama");

  const handleConfirmAdd = async () => {
    const { modelName, isInstalled } = confirmDialog;
    setConfirmDialog({ open: false, modelName: "", isInstalled: false });

    if (isInstalled) {
      // Model is already installed, just add to credential
      await createCredentialMutation.mutateAsync({
        provider: "ollama",
        credentialType: "ai_model",
        name: modelName,
        apiKey: "",
        baseUrl: ollamaCred?.baseUrl,
      });
    } else {
      // Model needs to be downloaded first
      await pullModel(modelName);
      // The model will be automatically added to credential after download completes
      // (handled in OllamaView useEffect that watches activePulls)
    }
  };

  return (
    <Dialog
      open={confirmDialog.open}
      onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {confirmDialog.isInstalled ? "Add Model" : "Download & Add Model"}
          </DialogTitle>
          <DialogDescription>
            {confirmDialog.isInstalled ? (
              <>
                The model{" "}
                <span className="font-mono font-semibold">
                  {confirmDialog.modelName}
                </span>{" "}
                is already installed. Would you like to add it to your available
                models?
              </>
            ) : (
              <>
                This will download{" "}
                <span className="font-mono font-semibold dark:text-green-600/90">
                  {confirmDialog.modelName}
                </span>{" "}
                from Ollama and add it to your available models. The download
                will continue in the background.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setConfirmDialog({
                open: false,
                modelName: "",
                isInstalled: false,
              })
            }
          >
            Cancel
          </Button>
          <Button variant="brand" size="sm" onClick={handleConfirmAdd}>
            {confirmDialog.isInstalled ? (
              <>
                <CheckIcon className="w-4 h-4 mr-2" />
                Add Model
              </>
            ) : (
              <>
                <DownloadIcon className="size-4 mr-2" />
                Download & Add
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
