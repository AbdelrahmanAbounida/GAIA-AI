"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Search, MessageSquare, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Image from "next/image";
import MCPIcon from "@/public/icons/mcp.png";
import MCPDarkIcon from "@/public/icons/mcp.svg";

const useCases = [
  {
    id: "knowledge",
    label: "Knowledge",
    icon: Database,
    title: "Intelligent Documentation Search",
    videoUrlDark:
      "https://a62edz1qni.ufs.sh/f/zshoAVKVBR3iUvQ5GZyda3fjcvP2yYEpFtToSei9hsxOLzKG",
    videoUrlLight:
      "https://a62edz1qni.ufs.sh/f/zshoAVKVBR3iEDDg2F1AUC60PVzJWx8qGr5ygcjX4BKDHnN3",
  },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    title: "Enterprise Knowledge Management",
    videoUrlDark:
      "https://a62edz1qni.ufs.sh/f/zshoAVKVBR3imHQhsN4COuJSheAYxBzcQVo1ZpRajLw6dP3C",
    videoUrlLight:
      "https://a62edz1qni.ufs.sh/f/zshoAVKVBR3ieWhUFBj1JMs3QDgVqivHtNyXh6muzU7w2EPb",
  },
  {
    id: "mcp",
    label: "MCP",
    icon: MessageSquare,
    title: "Customer Support Automation",
    videoUrlDark:
      "https://a62edz1qni.ufs.sh/f/zshoAVKVBR3iexHO73j1JMs3QDgVqivHtNyXh6muzU7w2EPb",
    videoUrlLight:
      "https://a62edz1qni.ufs.sh/f/zshoAVKVBR3ifExQLBej0JxH8hCGVL79pSnazX4b6WyPoqur",
  },
  {
    id: "local",
    label: "Local Models",
    icon: Search,
    title: "Research & Analysis",
    videoUrlDark:
      "https://a62edz1qni.ufs.sh/f/zshoAVKVBR3iWZ6My2Bi2vQyjzNGbZgCMD1ePtE4ncrflB0h",
    videoUrlLight:
      "https://a62edz1qni.ufs.sh/f/zshoAVKVBR3ig7YEsYtzlCMc5p3Zm7GaXwLqdN6kFQVeJjuS",
  },
];

export function UseCasesSection() {
  const [activeCase, setActiveCase] = useState(useCases[0]);
  const [isDark, setIsDark] = useState(false);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Autoplay video when switching tabs
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, [activeCase]);

  const currentVideoUrl = isDark
    ? activeCase.videoUrlDark
    : activeCase.videoUrlLight;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-gaia-600 dark:text-gaia-400 mb-4">Use cases</p>
          <h2 className="text-2xl font-semibold text-gaia-900 dark:text-gaia-100 sm:text-3xl">
            Built for{" "}
            <span className="text-green-700 dark:text-green-500">
              every team
            </span>
          </h2>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-1 p-1.5 rounded-xl bg-gaia-100 dark:bg-gaia-800 border border-gaia-400 dark:border-gaia-700">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              const isActive = useCase.id === activeCase.id;

              return (
                <Button
                  size={"tiny"}
                  variant={useCase.id == activeCase.id ? "brand" : "ghost"}
                  key={useCase.id}
                  onClick={() => setActiveCase(useCase)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 h-7 rounded-md text-xs font-medium transition-all duration-300",
                    activeCase.id === useCase.id
                      ? "gap-0 text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground "
                  )}
                >
                  {useCase.id === "mcp" ? (
                    <>
                      <Image
                        src={MCPIcon.src}
                        alt="mcp"
                        width={15}
                        height={20}
                        className={cn(
                          "hidden dark:block",
                          activeCase.id === useCase.id && "block"
                        )}
                      />
                      <Image
                        src={MCPDarkIcon.src}
                        alt="mcp"
                        width={15}
                        height={20}
                        className={cn(
                          "dark:hidden",
                          activeCase.id === useCase.id && "hidden"
                        )}
                      />
                    </>
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{useCase.label}</span>
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCase.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-1 gap-8 items-center"
          >
            <div className="relative rounded-lg border border-gaia-400 dark:border-gaia-800 overflow-hidden">
              <div className="aspect-video relative bg-gaia-100 dark:bg-gaia-900">
                <video
                  ref={videoRef}
                  key={currentVideoUrl}
                  src={currentVideoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
