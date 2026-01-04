"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, PlusIcon, CheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { useProjects } from "@/hooks/use-projects";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { CreateProjectModal2 } from "../modals/new-project-modal2";

export const ProjectsSwitcher = ({ className }: { className?: string }) => {
  const { projects } = useProjects();
  const { activeProjectId, setActiveProject } = useAppStore();
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const router = useRouter();

  return (
    <div className={cn(" ")}>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          className={cn(
            "focus:outline-none!   focus:ring-0! ",
            "border-gaia-300 dark:border-gaia-700 dark:text-white/70 hover:bg-gaia-200",
            className
          )}
        >
          <Button variant="outline" size={"tiny"} className="text-sm px-5 h-7 ">
            <span className="truncate text-xs">
              {activeProject?.name || "Select Project"}
            </span>
            <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 ml-3.5" align="start">
          {projects.length === 0 ? (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No projects yet</span>
            </DropdownMenuItem>
          ) : (
            projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => {
                  setActiveProject(project.id);
                  router.push(`/projects/${project.id}/chat`);
                }}
                className="flex items-center justify-between"
              >
                <span className="truncate">{project.name}</span>
                {project.id === activeProjectId && (
                  <CheckIcon className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator className=" " />
          {/* */}
          <CreateProjectModal2>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <PlusIcon className="h-4 w-4" />
              <span className="ml-2">New Project</span>
            </DropdownMenuItem>
          </CreateProjectModal2>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
