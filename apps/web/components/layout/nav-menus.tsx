"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import Link from "next/link";
import useWindowSize from "@/store/use-window-size";
import FeedbackModal from "../modals/feedback-modal";

export function NavMenus({
  items,
  title,
  className,
}: {
  title: string;
  className?: string;
  items: {
    title?: string;
    url: string;
    icon: LucideIcon;
    minScreenWidth?: number;
    external?: boolean;
    isModal?: boolean;
  }[];
}) {
  const currentPath = usePathname();
  const segment = useSelectedLayoutSegment();

  const isActiveNav = (navLink: string) => {
    return currentPath === navLink || navLink.includes(segment!);
  };

  const screenWidth = useWindowSize();

  return (
    <SidebarGroup
      className={cn("group-data-[collapsible=icon]:hidden", className)}
    >
      {title && <SidebarGroupLabel className="">{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item, index) =>
          item.isModal ? (
            <FeedbackModal key={index} />
          ) : (
            <SidebarMenuItem
              className={
                item.minScreenWidth && screenWidth < item.minScreenWidth
                  ? "hidden"
                  : ""
              }
              key={item.title}
            >
              <SidebarMenuButton
                className="data-[active=true]/menu-button:bg-gaia-300/50! data-[active=true]/menu-button:font-medium! hover:scale-[1.01] focus:scale-100  rounded-xl h-10 hover:bg-gaia-100 data-[active=true]/menu-button:text-zinc-900!"
                // className="!py-4 hover:bg-zinc-200/50 transition-all  data-[active=true]/menu-button:bg-zinc-200/50 data-[active=true]/menu-button:!text-ladder data-[active=true]/menu-button:hover:bg-ladder/5"
                asChild
                isActive={isActiveNav(item.url)}
              >
                <Link href={item.url} target={item.external ? "_blank" : ""}>
                  <item.icon className=" " />
                  <span className="">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
