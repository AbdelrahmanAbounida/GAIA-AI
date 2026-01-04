import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  ActiveLocalModelsViewTab,
  useLocalModelStore,
} from "@/store/use-local-models";
import { MainAlerts } from "./local/main-alerts";
import { AllView } from "./local/view-all";
import { OpenAICompatibleView } from "./local/view-openai-compatible";
import { OllamaView } from "./local/view-ollama";
import { ConfirmDownloadModal } from "./local/confirm-download-modal";
import { MainTabs } from "./local/main-tabs";

interface LocalModelsViewProps {
  view?: "ai_models" | "embeddings";
}

export function LocalModelsView({ view = "ai_models" }: LocalModelsViewProps) {
  // tabs
  const activeTab = useLocalModelStore((s) => s.currentActiveTab);
  const setActiveTab = useLocalModelStore((s) => s.setCurrentActiveTab);

  return (
    <div className="h-full bg-background w-full">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 h-full">
        <Tabs
          value={activeTab}
          onValueChange={(e) => setActiveTab(e as ActiveLocalModelsViewTab)}
          className="w-full h-full"
        >
          {/* TABS  */}
          <MainTabs view={view} />

          {/* ALERTS */}
          <MainAlerts />

          <TabsContent value="all" className="focus-visible:outline-none">
            <AllView view={view} />
          </TabsContent>

          {/* OPRNAI Compatible */}
          <TabsContent
            value="openai-compatible"
            className="focus-visible:outline-none"
          >
            <OpenAICompatibleView />
          </TabsContent>

          {/* OLLAMA View  */}
          <TabsContent
            value="ollama"
            className="focus-visible:outline-none h-full flex flex-col"
          >
            <OllamaView view={view} />
          </TabsContent>
        </Tabs>

        {/* CONFIRM DOWNLOAD MOLDEL */}
        <ConfirmDownloadModal />
      </div>
    </div>
  );
}
