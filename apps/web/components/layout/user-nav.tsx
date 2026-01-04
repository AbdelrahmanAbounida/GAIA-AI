"use client";
import { ChevronsUpDown, LogOut, Folders, Key } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/auth-client";
import { useAppStore } from "@/store/use-app-store";
import Image from "next/image";
import { ThemeSwitcher } from "../theme-switcher";
import { PromptModal } from "../modals/prompt-modal";

export const UserNav = ({
  showLong = true,
  align = "start",
  className,
  menuClassName,
  avatarClassName,
}: {
  showLong?: boolean;
  align?: "start" | "end" | "center";
  className?: string;
  menuClassName?: string;
  avatarClassName?: string;
}) => {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const setActiveProject = useAppStore((state) => state.setActiveProject);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ring-0! outline-none!" asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 px-2 py-2 h-auto",
            showLong &&
              "rounded-full border-gaia-300 dark:border-gaia-600 border hover:bg-transparent",
            className
          )}
        >
          <Avatar className={cn("h-8 w-8 cursor-pointer", avatarClassName)}>
            <AvatarImage
              src={session?.user?.image || ""}
              alt={session?.user?.name || ""}
            />
            <AvatarFallback className="text-zinc-700 border-gaia-500/20 dark:border-gaia-500 border bg-white hover:opacity-90">
              {session?.user?.name?.slice(0, 2)?.toUpperCase() || "AF"}
            </AvatarFallback>
          </Avatar>
          {showLong && (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {session?.user?.name || ""}
                </span>
                <span className="truncate text-xs">
                  {session?.user?.email || ""}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          "w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg",
          menuClassName
        )}
        side="bottom"
        align={align}
        sideOffset={4}
      >
        <DropdownMenuItem
          onClick={() => {
            window.open("/api/scalar", "_blank", "noopener,noreferrer");
          }}
        >
          <Image
            className="p-0 m-0 mr-1 pb-1 hidden dark:block"
            src={"/icons/scalar.svg"}
            alt="scalar"
            width={13}
            height={13}
          />
          <Image
            className="p-0 m-0 mr-1 pb-1 dark:hidden"
            src={"/icons/scalar-light.svg"}
            alt="scalar"
            width={13}
            height={13}
          />
          API Routes
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            router.push(`/credentials`);
          }}
        >
          <Key className="mr-1 ml-0 size-3.5 dark:text-white" />
          Credentials
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            router.push(`/projects/`);
          }}
        >
          <Folders className="mr-1 ml-0 size-3.5 dark:text-white" />
          Projects
        </DropdownMenuItem>

        <DropdownMenuItem
          className="hover:bg-transparent p-0"
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          <PromptModal />
        </DropdownMenuItem>

        <ThemeSwitcher />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={async () => {
            setActiveProject(null);
            await authClient.signOut();
            router.push("/");
            window.location.reload();
          }}
        >
          <LogOut className="size-3.5 dark:text-white" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
