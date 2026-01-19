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
import { isVercel } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Cpu, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedbackModal from "../feedback-modal";

interface LocalModelsViewProps {
  view?: "ai_models" | "embeddings";
}

export function LocalModelsView({ view = "ai_models" }: LocalModelsViewProps) {
  // tabs
  const activeTab = useLocalModelStore((s) => s.currentActiveTab);
  const setActiveTab = useLocalModelStore((s) => s.setCurrentActiveTab);

  if (isVercel()) {
    return (
      <div className="h-full w-full">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 h-full">
          <Card className="border-none shadow-none! bg-transparent!">
            <CardContent className="flex flex-col items-center justify-center py-12 w-full">
              <Cpu className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Local models not available on this online version
              </h3>
              <p className="text-sm text-gray-500 mb-6 text-center max-w-2xl">
                Local Models are only available locally. If you want to use
                local models, Please check the documentation for more
                information about AI model configuration.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      "https://gaia-docs.com/features/ai-models",
                      "_blank",
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Check Docs
                </Button>
                <FeedbackModal>
                  <Button variant="brand" size="sm">
                    Submit Feedback
                  </Button>
                </FeedbackModal>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full  w-full">
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
