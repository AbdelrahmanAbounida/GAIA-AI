"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  label: string;
  description?: string;
  models: Model[];
  selectedModels: string[];
  onToggle: (modelId: string) => void;
  multiSelect?: boolean;
}

export function ModelSelector({
  label,
  description,
  models,
  selectedModels,
  onToggle,
  multiSelect = true,
}: ModelSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {models.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          return (
            <Badge
              key={model.id}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                isSelected && "bg-primary text-primary-foreground"
              )}
              onClick={() => {
                if (!multiSelect && !isSelected) {
                  // For single select, clear others first
                  selectedModels.forEach((id) => {
                    if (id !== model.id) onToggle(id);
                  });
                }
                onToggle(model.id);
              }}
            >
              {model.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
