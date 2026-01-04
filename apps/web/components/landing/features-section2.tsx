"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Database,
  Bot,
  Plug,
  MessageSquare,
  Layers,
  Cpu,
  Search,
  Zap,
  Check,
  FolderOpen,
  FileText,
  Video,
  Sparkles,
  ImageIcon,
  CpuIcon,
  WrenchIcon,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import { ProviderIcon } from "../modals/credential-modal/provider-icons";

export function FeaturesSection() {
  const [isHovered, setisHovered] = useState(true);
  const [hoveredEmbedding, sethoveredEmbedding] = useState(true);
  const [dots, setDots] = useState<{ x: number; y: number; delay: number }[]>(
    []
  );

  useEffect(() => {
    const generatedDots = Array.from({ length: 29 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setDots(generatedDots);
  }, []);
  const fileTypes = [
    { icon: Image, label: "Image" },
    { icon: Image, label: "Image" },
    { icon: FileText, label: "Document" },
    { icon: FileText, label: "Document" },
    { icon: Video, label: "Video" },
    { icon: Video, label: "Video" },
  ];

  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground mb-4">Build with confidence</p>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl text-balance">
            Everything you need for{" "}
            <span className="text-brand-800">Production Agents</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-1 row-span-2 rounded-xl border dark:border-gaia-700 dark:bg-gaia-950 p-5 flex flex-col transition-all duration-300 hover:scale-[1.01] dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            onMouseEnter={() => setisHovered(true)}
            onMouseLeave={() => setisHovered(true)}
          >
            <div className="flex items-center gap-2 mb-2">
              <WrenchIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Custom Tools
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Build and register your own agent tools.
            </p>

            {/* Enhanced 3D Visual artifact */}
            <div className="flex-1 flex items-center justify-center my-4">
              <div
                className={`relative transition-transform duration-700 ${isHovered ? "scale-105" : ""}`}
              >
                <svg viewBox="0 0 200 200" className="w-48 h-48" fill="none">
                  {/* Connection lines */}
                  <line
                    x1="100"
                    y1="100"
                    x2="50"
                    y2="50"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/30"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="150"
                    y2="50"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/30"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="50"
                    y2="150"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/30"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="150"
                    y2="150"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/30"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="30"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/30"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="170"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/30"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="30"
                    y2="100"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/30"
                  />
                  <line
                    x1="100"
                    y1="100"
                    x2="170"
                    y2="100"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground/30"
                  />

                  {/* Center node */}
                  <circle
                    cx="100"
                    cy="100"
                    r="12"
                    className={`transition-all duration-300 ${isHovered ? "fill-brand-800" : "fill-muted-foreground/50"}`}
                  />

                  {/* Outer nodes */}
                  <circle
                    cx="50"
                    cy="50"
                    r="8"
                    className={`transition-all duration-500 ${isHovered ? "fill-brand-800" : "fill-muted-foreground/30"}`}
                    style={{ transitionDelay: "0ms" }}
                  />
                  <circle
                    cx="150"
                    cy="50"
                    r="8"
                    className={`transition-all duration-500 ${isHovered ? "fill-brand-800" : "fill-muted-foreground/30"}`}
                    style={{ transitionDelay: "50ms" }}
                  />
                  <circle
                    cx="50"
                    cy="150"
                    r="8"
                    className={`transition-all duration-500 ${isHovered ? "fill-brand-800" : "fill-muted-foreground/30"}`}
                    style={{ transitionDelay: "100ms" }}
                  />
                  <circle
                    cx="150"
                    cy="150"
                    r="8"
                    className={`transition-all duration-500 ${isHovered ? "fill-brand-800" : "fill-muted-foreground/30"}`}
                    style={{ transitionDelay: "150ms" }}
                  />
                  <circle
                    cx="100"
                    cy="30"
                    r="6"
                    className={`transition-all duration-500 ${isHovered ? "fill-primary/60" : "fill-muted-foreground/20"}`}
                    style={{ transitionDelay: "200ms" }}
                  />
                  <circle
                    cx="100"
                    cy="170"
                    r="6"
                    className={`transition-all duration-500 ${isHovered ? "fill-primary/60" : "fill-muted-foreground/20"}`}
                    style={{ transitionDelay: "250ms" }}
                  />
                  <circle
                    cx="30"
                    cy="100"
                    r="6"
                    className={`transition-all duration-500 ${isHovered ? "fill-primary/60" : "fill-muted-foreground/20"}`}
                    style={{ transitionDelay: "300ms" }}
                  />
                  <circle
                    cx="170"
                    cy="100"
                    r="6"
                    className={`transition-all duration-500 ${isHovered ? "fill-primary/60" : "fill-muted-foreground/20"}`}
                    style={{ transitionDelay: "350ms" }}
                  />
                </svg>
              </div>
            </div>

            <ul className="space-y-1.5 mt-auto">
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary" /> Build Tools for
                advanced Agents
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary" /> Use openAI Tools
                Tools
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary" /> Or build your own
                Tools
              </li>
            </ul>

            <style jsx>{`
              @keyframes float {
                0%,
                100% {
                  transform: translateY(0);
                }
                50% {
                  transform: translateY(-5px);
                }
              }
            `}</style>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border dark:border-gaia-700 dark:bg-gaia-950 p-5 transition-all duration-300 hover:scale-[1.02] dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground" />

              <h3 className="text-sm font-medium text-foreground">
                Vectorstores
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Connect to{" "}
              <span className="text-foreground font-medium">8+ providers</span>{" "}
              from Pinecone to local FAISS.
            </p>

            {/* Enhanced provider grid */}
            <div className="grid grid-cols-6 gap-1.5">
              {[
                "pinecone",
                "milvus",
                "supabase",
                "qdrant",
                "weaviate",
                "chroma",
              ].map((letter, i) => (
                <div
                  key={i}
                  className="aspect-square size-12 dark:border-gaia-700 rounded-xl border dark:bg-muted/50 flex items-center justify-center text-xs font-mono text-muted-foreground dark:hover:bg-gaia-800/10 hover:text-brand-800 transition-all duration-200 cursor-pointer"
                >
                  <ProviderIcon provider={letter} className="size-4.5" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* MCP Connections - Medium card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border group dark:border-gaia-700 dark:bg-gaia-950 p-5 transition-all duration-300 hover:scale-[1.02] dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/icons/mcp.png"
                alt="mcp"
                width={50}
                height={50}
                className="h-4 w-4 text-muted-foreground hidden dark:block"
              />
              <img
                src="/icons/mcp.svg"
                alt="mcp"
                width={50}
                height={50}
                className="h-4 w-4 text-muted-foreground dark:hidden"
              />
              <h3 className="text-sm font-medium text-foreground">
                MCP Connections
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Extend agents with{" "}
              <span className="text-foreground font-medium">
                Model Context Protocol
              </span>
              .
            </p>

            {/* Visual artifact - Connection lines with infinite animation */}
            <div className="flex justify-center gap-1">
              {Array.from({ length: 21 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="w-1.5 rounded-full bg-linear-to-t from-brand-800 to-brand-700/20 group-hover:to-brand-600/60"
                  initial={{ height: 20 }}
                  animate={{
                    height: [
                      20 + Math.sin(index * 0.5) * 10,
                      32 + Math.sin(index * 0.5) * 10,
                      20 + Math.sin(index * 0.5) * 10,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.05,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Document Storage - Medium card */}
          <StorageCard />

          {/* Embeddings - Medium card with sparkles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            onMouseEnter={() => sethoveredEmbedding(true)}
            // onMouseLeave={() => sethoveredEmbedding(false)}
            className="rounded-xl border dark:border-gaia-700 dark:bg-gaia-950 p-5 transition-all duration-300 hover:scale-[1.02] dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Embeddings
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Generate embeddings with{" "}
              <span className="text-foreground font-medium">any model</span>.
            </p>

            {/* Visual representation */}
            <svg className="w-full h-full" viewBox="0 0 180 110">
              {/* Connection lines */}

              {/* Animated dots */}
              {dots.map((dot, idx) => (
                <circle
                  key={idx}
                  cx={20 + dot.x * 1.1}
                  cy={10 + dot.y * 0.6}
                  // r={2.5}
                  r={hoveredEmbedding ? 3 : 2}
                  className={`transition-all duration-300 ${hoveredEmbedding ? "fill-brand-800" : "fill-muted-foreground/50"}`}
                  style={{
                    animation: hoveredEmbedding
                      ? `pulse 1.5s ease-in-out ${dot.delay}s infinite`
                      : "none",
                  }}
                />
              ))}
            </svg>
          </motion.div>

          {/* Bottom row - 3 smaller cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border gap-3 flex-col flex  dark:bg-gaia-950 dark:border-gaia-700 p-4 transition-all duration-300 hover:scale-[1.02] dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-3.5 w-3.5 text-brand-700" />
              <h3 className="text-xs font-medium text-foreground">
                Lexical Search
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              FlexSearch, MiniSearch, TF-IDF engines.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-xl flex flex-col gap-3  border dark:border-gaia-600/50 dark:bg-gaia-950 p-4 transition-all duration-300 hover:scale-[1.02] dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-3.5 w-3.5 text-brand-700" />
              <h3 className="text-xs font-medium text-foreground">
                Custom Tools
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Build and register your own agent tools.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="rounded-xl border flex flex-col gap-3 dark:border-gaia-600/50 dark:bg-gaia-950 p-4 transition-all duration-300 hover:scale-[1.02] dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <VideoIcon className="h-3.5 w-3.5 text-brand-700" />
              <h3 className="text-xs font-medium text-foreground">
                Multimodal
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Text, image, and audio generation.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function StorageCard() {
  const [hoveredFile, setHoveredFile] = useState<number | null>(null);
  const providers = [
    "openai",
    "anthropic",
    "google",
    "mistral",
    "cohere",
    "groq",
    "moonshotai",
    "xai",
    "deepseek",
    "azure",
    "cohere",
    "huggingface",
    "perplexity",
    "replicate",
    "morph",
    "cerebras",
    "alibaba",
    "kwaipilot",
    "minimax",
    "meta",
  ];

  return (
    <div className="group h-full min-h-[280px] rounded-xl border dark:border-gaia-700 dark:bg-gaia-950 p-6 transition-all duration-300 dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <CpuIcon className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">LLM Providers</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Connect to{" "}
        <span className="text-foreground font-medium">10+ providers</span> with
        a unified API. from Openai to Ollama models
      </p>{" "}
      {/* File Grid */}
      <div className="grid grid-cols-5 gap-2">
        {providers.map((provider, idx) => {
          return (
            <div
              key={idx}
              className={`aspect-square size-12 border rounded-xl  transition-all duration-200 flex items-center justify-center cursor-pointer ${
                hoveredFile === idx
                  ? "dark:border-green-700 dark:bg-gaia-800 scale-[1.04]"
                  : "dark:border-gaia-700 bg-gaia-100 dark:bg-gaia-800/50 "
              }`}
              onMouseEnter={() => setHoveredFile(idx)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              <ProviderIcon
                provider={provider}
                className={`h-4 w-4 transition-colors duration-200 ${
                  hoveredFile === idx
                    ? "text-green-700"
                    : "text-muted-foreground/50"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
