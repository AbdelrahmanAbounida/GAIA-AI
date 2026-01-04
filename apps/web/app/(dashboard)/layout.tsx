import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <div className="flex h-screen">
    //   <AppSidebar />
    //   <div className="flex flex-1 flex-col overflow-hidden">
    //     <Header />
    //     <main className="flex-1 overflow-auto bg-background p-6">
    //       {children}
    //     </main>
    //   </div>
    // </div>

    <SidebarProvider
      width={"16rem"}
      className="h-screen bg-gaia-200! dark:bg-background!"
    >
      <AppSidebar globalClassName=" bg-gaia-200!  dark:bg-gaia-950!" />
      <div className="flex flex-col w-full relative bg-gaia-200 dark:bg-gaia-900! ">
        <Header className="bg-gaia-200 dark:bg-background" />
        <SidebarInset className="shadow-none! rounded-2xl ">
          <div className="h-full mx-auto md:px-0 w-full bg-gaia-100  dark:bg-gaia-900!  overflow-auto  rounded-2xl  border">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
