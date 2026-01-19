"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useProjects } from "@/hooks/use-projects";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import { CreateProjectModal2 } from "../modals/new-project-modal2";
import { useMounted } from "@/hooks/use-mounted";
import { Logo } from "../logo";

export const ProjectsSwitcher = ({ className }: { className?: string }) => {
  const mounted = useMounted();
  const router = useRouter();
  const { isMobile } = useSidebar();

  const { projects } = useProjects();
  const { activeProjectId, setActiveProject } = useAppStore();

  if (!mounted) {
    return null;
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <SidebarMenu className={cn(className)}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-transparent p-1 data-[state=open]:text-sidebar-accent-foreground"
            >
              <Logo isLink={false} isIcon className="w-7 h-7" />
              <div className="group-data-[collapsible=icon]:hidden grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeProject?.name ?? "Select Project"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {projects.length}{" "}
                  {projects.length === 1 ? "project" : "projects"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Projects
            </DropdownMenuLabel>

            {projects.length === 0 ? (
              <></>
            ) : (
              projects.map((project, index) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => {
                    setActiveProject(project.id);
                    router.push(`/projects/${project.id}/chat`);
                  }}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Logo isLink={false} isIcon className="size-3.5 shrink-0" />
                  </div>
                  <span className="truncate flex-1">{project.name}</span>
                  {project.id === activeProjectId && (
                    <div className="ml-auto size-2 rounded-full bg-gaia-300 dark:bg-gaia-800" />
                  )}
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                router.push(`/projects/`);
              }}
              className=""
            >
              All Projects
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <CreateProjectModal2>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="gap-2 p-2"
              >
                <Plus className="size-4" />
                <div className="font-medium text-muted-foreground">
                  New Project
                </div>
              </DropdownMenuItem>
            </CreateProjectModal2>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
