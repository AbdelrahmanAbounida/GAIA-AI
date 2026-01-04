"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Cpu,
  Database,
  FileText,
  Layers,
  Search,
  Sparkles,
  Settings,
  Calendar,
  Hash,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Project } from "@gaia/db";
import { useAppStore } from "@/store/use-app-store";
import type { LucideIcon } from "lucide-react";

interface ProjectDetailsSheetProps {
  project: Project;
  onEdit?: () => void;
}

interface DetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  badge?: boolean;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function ProjectDetailsSheet({
  project,
  onEdit,
}: ProjectDetailsSheetProps) {
  const openProjectSheet = useAppStore((state) => state.openProjectSheet);
  const setOpenProjectSheet = useAppStore((state) => state.setOpenProjectSheet);

  const open = openProjectSheet === project?.id;

  const DetailRow = ({ icon: Icon, label, value, badge }: DetailRowProps) => (
    <div className="flex items-start justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {badge ? (
        <Badge variant="secondary" className="font-mono text-xs">
          {value}
        </Badge>
      ) : (
        <span className="text-sm font-medium">{value}</span>
      )}
    </div>
  );

  const Section = ({ title, children }: SectionProps) => (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(state) => {
        if (state) setOpenProjectSheet(project?.id);
        else if (openProjectSheet === project?.id) setOpenProjectSheet("");
      }}
    >
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-3 ring-0 outline-none">
        <SheetHeader>
          <SheetTitle className="text-xl">{project?.name}</SheetTitle>
          <SheetDescription className="text-sm">
            {project?.description || "No description provided"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Section title="Language Model">
            <DetailRow
              icon={Cpu}
              label="Provider"
              value={project?.llmProvider || "Not set"}
            />
            <DetailRow
              icon={Sparkles}
              label="Model"
              value={project?.llmModel}
              badge
            />
          </Section>

          <Separator />

          <Section title="Embeddings">
            <DetailRow
              icon={Layers}
              label="Provider"
              value={project?.embeddingProvider || "Not set"}
            />
            <DetailRow
              icon={Database}
              label="Model"
              value={project?.embeddingModel}
              badge
            />
          </Section>

          <Separator />

          <Section title="Vector Storage & Search">
            <DetailRow
              icon={Database}
              label="Vector Store"
              value={project?.vectorStore}
            />
            <DetailRow
              icon={Search}
              label="Search Type"
              value={project?.searchType || "hybrid"}
            />
            {project?.useReranker && (
              <DetailRow
                icon={Sparkles}
                label="Reranker"
                value={project?.reranker}
              />
            )}
          </Section>

          <Separator />

          <Section title="Document Processing">
            <DetailRow
              icon={Settings}
              label="Chunk Size"
              value={`${project?.chunkSize} tokens`}
            />
            <DetailRow
              icon={Settings}
              label="Chunk Overlap"
              value={`${project?.chunkOverlap} tokens`}
            />
            <DetailRow
              icon={Hash}
              label="Top K Results"
              value={project?.topK}
            />
          </Section>

          <Separator />

          <Section title="Statistics">
            <DetailRow
              icon={FileText}
              label="Total Documents"
              value={project?.totalDocuments}
            />
            {/* <DetailRow
              icon={Layers}
              label="Total Chunks"
              value={project?.totalChunks?.toLocaleString()}
            /> */}
          </Section>

          <Separator />

          <Section title="Timeline">
            <DetailRow
              icon={Calendar}
              label="Created"
              value={formatDistanceToNow(new Date(project?.createdAt), {
                addSuffix: true,
              })}
            />
            <DetailRow
              icon={Calendar}
              label="Last Updated"
              value={formatDistanceToNow(new Date(project?.updatedAt), {
                addSuffix: true,
              })}
            />
          </Section>

          {onEdit && (
            <div className="pt-4">
              <Button onClick={onEdit} className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Edit Configuration
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
