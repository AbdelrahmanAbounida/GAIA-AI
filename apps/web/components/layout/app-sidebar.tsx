"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "../logo";
import { UserNav } from "./user-nav";
import { redirect, useRouter, useSelectedLayoutSegment } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  FlagIcon,
  LockKeyholeIcon,
  MessageCircleIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import FeedbackModal from "../modals/feedback-modal";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import Image from "next/image";
import MCPIcon from "@/public/icons/mcp.png";
import MCPIconLight from "@/public/icons/mcp-light.svg";
import { useAppStore } from "@/store/use-app-store";
import { ProjectsSwitcher } from "./projects-switcher";
import { useChatHistory, useChatOperations } from "@/hooks/use-chat-operations";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Chat } from "@gaia/db";
import { ConfirmModal } from "../modals/confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const currentPath = usePathname();
  const currentSegment = useSelectedLayoutSegment();
  const { state } = useSidebar();
  const { user, isPending } = useCurrentUser();
  const [hydrated, setHydrated] = React.useState(false);

  const { activeProjectId } = useAppStore();
  const BASE_URL = `projects/${activeProjectId}`;

  // Extract current chat ID from path
  const currentChatId = React.useMemo(() => {
    const match = currentPath?.match(/\/chat\/([^\/]+)/);
    return match ? match[1] : undefined;
  }, [currentPath]);

  const isActive = (route: string) => {
    if (route === "/") {
      return currentPath === route;
    }
    return currentPath?.includes(route) || currentSegment?.includes(route);
  };

  React.useEffect(() => {
    setHydrated(true);
  }, [user]);

  if (!activeProjectId && !isPending && currentPath !== "/projects") {
    return redirect("/projects?error=project-not-found");
  }

  return (
    <Sidebar
      {...props}
      className={cn("", props.className)}
      variant="inset"
      collapsible={props.collapsible ?? "icon"}
    >
      <SidebarHeader className="bg-gaia-200 dark:bg-gaia-950 ">
        <SidebarMenu className="">
          <SidebarMenuItem className="">
            <SidebarMenuButton
              className=" ring-0! p-0! bg-gaia-200 dark:bg-gaia-950!"
              size="lg"
              asChild
            >
              <SidebarHeader className="bg-transparent w-full hover:bg-transparent dark:bg-gaia-950 dark:hover:bg-gaia-950 flex items-start justify-start gap-2">
                <ProjectsSwitcher className="flex-1" />
              </SidebarHeader>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarRail disabled={!user} />
      <SidebarContent className=" bg-gaia-200 dark:bg-background text-center pt-2 ">
        {!!user && (
          <>
            <SidebarMenu className="text-center  justify-center flex items-center gap-3 mt-4">
              <SidebarMenuButton
                tooltip={"New Chat"}
                asChild
                isActive={isActive("/chat") && !currentChatId}
                className=""
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/${BASE_URL}/chat?new=${Date.now()}`);
                }}
              >
                <Link href={`/${BASE_URL}/chat`}>
                  <MessageCircleIcon className="mr-1 ml-0 size-4!" />
                  <span className=" text-md">New Chat</span>
                </Link>
              </SidebarMenuButton>

              <SidebarMenuButton
                tooltip={"Tools & MCP"}
                asChild
                isActive={isActive("/tools")}
                className="group"
              >
                <Link href={`/${BASE_URL}/tools`}>
                  <Image
                    className={cn(
                      "hidden dark:block opacity-60  data-[active=true]/group:opacity-100 ",
                    )}
                    alt="mcp"
                    src={MCPIcon.src}
                    width={20}
                    height={20}
                  />
                  <Image
                    className={cn(
                      "block opacity-70 dark:hidden  data-[active=true]/group:opacity-100 ",
                    )}
                    alt="mcp"
                    src={MCPIconLight.src}
                    width={20}
                    height={20}
                  />
                  <span className=" text-md">Tools</span>
                </Link>
              </SidebarMenuButton>

              <SidebarMenuButton
                tooltip={"GAIA API Keys"}
                asChild
                isActive={isActive("/api-keys")}
              >
                <Link href={`/${BASE_URL}/api-keys`}>
                  <LockKeyholeIcon className="mr-1 ml-0 size-4!" />
                  <span className=" text-md">API Keys</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenu>

            {/* Chat History Section */}
            <div className="mt-6 px-2 group-data-[collapsible=icon]:hidden">
              <div className="px-2 mb-2">
                <h3 className="text-[13px] font-medium text-gaia-500 text-start dark:text-gaia-300/70 tracking-wider">
                  Recent Chats
                </h3>
              </div>
              <ChatHistoryList
                baseUrl={BASE_URL}
                currentChatId={currentChatId}
              />
            </div>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="bg-gaia-200 dark:bg-background ">
        <div className="flex flex-col gap-2 mt-auto! mb-4">
          <FeedbackModal>
            <Button variant={"outline"} size={"sm"} className="p-0">
              <FlagIcon className="size-3.5!" />
              <span className="group-data-[collapsible=icon]:hidden text-xs">
                Feedback
              </span>
            </Button>
          </FeedbackModal>
        </div>
        {!!user && <UserNav showLong={state == "expanded"} />}
      </SidebarFooter>
    </Sidebar>
  );
}

function ChatHistoryList({
  baseUrl,
  currentChatId,
}: {
  baseUrl: string;
  currentChatId?: string;
}) {
  const router = useRouter();
  const {
    data: chatHistory,
    isFetching,
    isFetchingNextPage,
    isLoading,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useChatHistory();

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeleteChat = async (chatId: string) => {
    if (chatId === currentChatId) {
      router.push(`/${baseUrl}/chat`);
    }
    await refetch();
  };

  if (isLoading) {
    return <ChatHistorySkeleton count={5} />;
  }

  if (!chatHistory || chatHistory.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground"></div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex flex-col gap-1 max-h-[calc(100vh-400px)]"
    >
      <SidebarMenu>
        {chatHistory.map((chat) => (
          <ChatHistoryItem
            key={chat.id}
            chat={chat}
            isActive={currentChatId === chat.id}
            baseUrl={baseUrl}
            onDelete={handleDeleteChat}
          />
        ))}

        {/* Loading indicator for next page */}
        {isFetchingNextPage && <ChatHistorySkeleton count={2} />}

        {/* Intersection observer target */}
        <div ref={observerTarget} className="h-4" />
      </SidebarMenu>
    </div>
  );
}

function ChatHistoryItem({
  chat,
  isActive,
  baseUrl,
  onDelete,
}: {
  chat: Chat;
  isActive: boolean;
  baseUrl: string;
  onDelete: (chatId: string) => Promise<void>;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const deleteChat = useMutation(
    orpcQueryClient.authed.chat.delete.mutationOptions({
      onSuccess: async (response) => {
        if (response?.success) {
          await onDelete(chat.id);
          queryClient.invalidateQueries({
            queryKey: ["chats"],
          });
        }
      },
    }),
  );
  const handleDelete = async () => {
    try {
      await deleteChat.mutateAsync({ id: chat.id });
      await onDelete(chat.id);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // Keep button visible when dropdown is open
  const showButton = isHovered || dropdownOpen;

  return (
    <SidebarMenuItem
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="flex items-center gap-1 w-full">
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className="flex-1 justify-start"
          tooltip={chat.name || "Untitled Chat"}
        >
          <Link href={`/${baseUrl}/chat/${chat.id}`}>
            <span className="truncate text-[13.5px] text-muted-foreground dark:text-white/80">
              {chat.name || "Untitled Chat"}
            </span>
          </Link>
        </SidebarMenuButton>

        {/* Delete Dropdown */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 transition-opacity ${
                showButton ? "opacity-100" : "opacity-0"
              }`}
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <ConfirmModal
              onDelete={handleDelete}
              description={`Are you sure you want to delete "${chat.name || "Untitled Chat"}"? This action cannot be undone.`}
              isPending={deleteChat.isPending}
            >
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Chat
              </DropdownMenuItem>
            </ConfirmModal>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SidebarMenuItem>
  );
}

function ChatHistorySkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SidebarMenuItem key={i}>
          <Skeleton className="w-full h-9 rounded-md" />
        </SidebarMenuItem>
      ))}
    </>
  );
}
