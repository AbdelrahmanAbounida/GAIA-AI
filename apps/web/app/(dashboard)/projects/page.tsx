"use client";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Trash2,
  FolderOpen,
  Cpu,
  Database,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { Project } from "@gaia/db";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDetailsSheet } from "@/components/project-details";
import { showErrorToast } from "@/components/ui/toast";
import { CreateProjectModal2 } from "@/components/modals/new-project-modal2";

export default function ProjectsPage() {
  const { setActiveProject, openProjectSheet } = useAppStore();

  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(
    orpcQueryClient.authed.project.list.queryOptions({
      input: {
        limit: 20,
      },
    })
  );

  const deleteMutation = useMutation(
    orpcQueryClient.authed.project.delete.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.project.list.key(),
        });
      },
    })
  );
  const projects: Project[] = data?.projects!;

  const router = useRouter();

  const deleteProject = ({ projectId }: { projectId: string }) => {
    deleteMutation.mutate({
      projectId,
    });
  };

  if (isPending) {
    return (
      <div className="flex flex-wrap max-w-5xl mx-auto gap-9 items-start justify-center">
        <Skeleton className="h-42 w-[400px]! animate-pulse" />
        <Skeleton className="h-42 w-[400px]! animate-pulse" />
        <Skeleton className="h-42 w-[400px]! animate-pulse" />
        <Skeleton className="h-42 w-[400px]! animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto mt-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-medium text-foreground">Projects</h2>
          <p className="text-muted-foreground text-sm">
            Create and manage your RAG projects
          </p>
        </div>

        {projects?.length > 0 && (
          // <CreateProjectModal>
          //   <Button variant={"brand"} size={"tiny"}>
          //     <Plus className="h-4 w-4" />
          //     New Project
          //   </Button>
          // </CreateProjectModal>
          <CreateProjectModal2 />
        )}
      </div>

      {projects?.length! === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gaia-200 dark:bg-gaia-800">
              <FolderOpen className="h-6 w-6 text-green-700" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No projects yet</h3>
            <p className="mb-4 text-center text-gray-500 text-sm dark:text-muted-foreground">
              Create your first GAIA project to start building intelligent
              document Q&A systems.
            </p>
            <CreateProjectModal2>
              <Button variant={"brand"} size={"tiny"}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </CreateProjectModal2>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={cn(
                "group shadow-none dark:shadow-lg cursor-pointer transition-colors  hover:bg-gaia-200  hover:border-border dark:hover:border-gaia-700 dark:hover:bg-gaia-800/90",
                " dark:bg-[#202020] group relative"
              )}
              onClick={() => {
                setActiveProject(project.id);
                // setOpenProjectSheet(project.id);
                router.push(`/projects/${project.id}/chat`);
              }}
            >
              {openProjectSheet === project.id && (
                <ProjectDetailsSheet project={project} />
              )}
              <CardHeader className="flex pb-0! h-2.5 flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">
                    {project.name}
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="outline-none border-none ring-0"
                    asChild
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    className="border dark:border-gaia-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ConfirmModal
                      description="Deleting project will delete all documents."
                      onDelete={() => {
                        deleteProject({ projectId: project.id });
                      }}
                    >
                      <div className="flex cursor-pointer items-center h-8 hover:bg-gaia-200 dark:hover:bg-gaia-700/20 rounded-xl gap-2 text-sm pl-2">
                        <Trash2 className="mr-2 h-4 w-4 text-red-700" />
                        Delete
                      </div>
                    </ConfirmModal>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cpu className="h-4 w-4" />
                    <span>{project.llmModel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" />
                    <span>{project.vectorStore}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{project?.totalDocuments} documents</span>
                  </div>
                  <div className="pt-2 text-xs text-muted-foreground">
                    Updated{" "}
                    {formatDistanceToNow(new Date(project.updatedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
