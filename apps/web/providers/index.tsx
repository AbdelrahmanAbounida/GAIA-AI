import React from "react";
// import { ThemeProvider } from "./theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "./query-provider";
import { Toaster } from "sonner";
import {
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  MessageCircleWarning,
  TriangleAlert,
  XIcon,
} from "lucide-react";
import { ThemeProvider } from "next-themes";

export const AllProviders = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="dark" attribute="class">
        {/* <Toaster richColors /> */}
        <Toaster
          duration={5000}
          position="top-right"
          icons={{
            success: (
              <CheckIcon className="fill-green-600 text-white w-5 h-5 mt-1.5 border-white bg-green-600 dark:bg-green-800 rounded-2xl p-1" />
            ),
            error: (
              <XIcon className="fill-red-500 text-white w-5 h-5 mt-1.5 border-white bg-red-600 dark:bg-red-800 rounded-2xl p-1" />
            ),
            info: (
              <InfoIcon className="text-blue-600  w-5 h-5 mt-1.5   rounded-2xl" />
            ),
            warning: (
              <TriangleAlert className="text-orange-600!  w-5 h-5 mt-1.5   rounded-2xl" />
            ),
          }}
          toastOptions={{
            className:
              " border-gaia-400! dark:border-zinc-700/55! flex! items-start! p-3! pl-4! justify-start!  dark:bg-gaia-800! text-gaia-600! min-h-[65px]!",
          }}
        />
        {children}
      </ThemeProvider>
    </QueryProvider>
  );
};
