import { showErrorToast } from "@/components/ui/toast";
import { orpcQueryClient } from "@/lib/orpc/client";
import { useRAGStore } from "@/store/use-rag-store";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCurrentProjectId } from "./use-projects";

export const useRAGSettings = () => {
  const { projectId } = useCurrentProjectId();
  const settings = useRAGStore((state) => state.settings);
  const setSettings = useRAGStore((state) => state.setSettings);
  const {
    data: ragResponse,
    isPending: isLoadingSettings,
    error: loadError,
  } = useQuery(
    orpcQueryClient.authed.rag.getRAGSettings?.queryOptions({
      input: { projectId: projectId! },
      queryKey: ["rag-settings", projectId],
    })
  );
  useEffect(() => {
    if (!isLoadingSettings && ragResponse) {
      if (ragResponse?.success && ragResponse?.settings) {
        setSettings(ragResponse.settings);
      }
    }
  }, [ragResponse, isLoadingSettings]);

  useEffect(() => {
    if (loadError) {
      showErrorToast({
        title: "Failed to load settings",
        description: loadError.message || "Could not fetch RAG settings",
        position: "bottom-right",
      });
    }
  }, [loadError]);

  return {
    ragSettings: settings,
    isLoadingSettings,
    loadError,
  };
};
