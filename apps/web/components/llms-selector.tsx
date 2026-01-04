"use client";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { useAvailableModels } from "@/hooks/use-availabele-models";
import { CheckIcon, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

export const LLMSelector = () => {
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const { availableLLMs, isPending } = useAvailableModels();

  // Group models by provider (using model.id as provider)
  const providers = useMemo(() => {
    return Array.from(new Set(availableLLMs.map((model) => model.id)));
  }, [availableLLMs]);

  // Auto-select first model if none selected
  const effectiveSelectedModel = selectedModel || availableLLMs[0]?.id || "";
  const selectedModelData = availableLLMs.find(
    (model) => model.id === effectiveSelectedModel
  );

  if (isPending) {
    return (
      <Button className="w-[150px] h-7" variant="ghost" disabled>
        Loading...
      </Button>
    );
  }

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <Button className="w-[150px] h-7 justify-between" variant="ghost">
          {selectedModelData?.id && (
            <ModelSelectorLogo provider={selectedModelData.id} />
          )}
          {selectedModelData?.name && (
            <ModelSelectorName>{selectedModelData.name}</ModelSelectorName>
          )}
          <ChevronDown className="ml-auto size-4 opacity-50" />
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent className="h-full max-h-[50vh]! my-auto">
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          {providers.map((provider) => (
            <ModelSelectorGroup heading={provider} key={provider}>
              {availableLLMs
                .filter((model) => model.id === provider)
                .map((model) => (
                  <ModelSelectorItem
                    key={model.id}
                    onSelect={() => {
                      setSelectedModel(model.id);
                      setOpen(false);
                    }}
                    value={model.id}
                  >
                    <ModelSelectorLogo provider={model.id} />
                    <ModelSelectorName>{model.name}</ModelSelectorName>
                    {effectiveSelectedModel === model.id ? (
                      <CheckIcon className="ml-auto size-4" />
                    ) : (
                      <div className="ml-auto size-4" />
                    )}
                  </ModelSelectorItem>
                ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
};
