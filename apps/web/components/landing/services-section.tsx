"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CpuIcon,
  Database,
  Cpu,
  Plug,
  Zap,
  Code,
} from "lucide-react";

const services = [
  {
    title: "RAG Pipeline Starter",
    description:
      "A complete RAG pipeline with vector storage, embedding generation, and retrieval capabilities built on GAIA.",
    icons: [Database, CpuIcon, Zap],
  },
  {
    title: "Agent Builder Kit",
    description:
      "Build custom AI agents with MCP integration, tool support, and memory management out of the box.",
    icons: [CpuIcon, Plug],
  },
  {
    title: "Local LLM Setup",
    description:
      "Run models locally with Ollama integration. Complete privacy with zero cloud dependencies.",
    icons: [Cpu, Code, CpuIcon],
  },
  {
    title: "Multi-Provider Hub",
    description:
      "Connect to OpenAI, Anthropic, Google, and more with a unified API interface for seamless switching.",
    icons: [Zap, CpuIcon],
  },
  {
    title: "Vector Search Engine",
    description:
      "Enterprise-grade vector search with support for Pinecone, Weaviate, ChromaDB, and local FAISS.",
    icons: [Database, Zap],
  },
  {
    title: "MCP Integration Pack",
    description:
      "Extend your agents with Model Context Protocol. Connect to external tools and data sources.",
    icons: [Plug, Code],
  },
];

export function ServicesSection() {
  return (
    <section className="py-20 ">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground mb-4">Templates & Starters</p>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl text-balance">
            Get started with{" "}
            <span className="text-brand-800">different usecases</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-lg border hover:bg-gaia-100 dark:hover:bg-gaia-950 border-gaia-400/80 dark:border-border bg-card p-6 transition-all duration-300 hover:border-gaia-400 dark:hover:border-gaia-700 hover:shadow-lg  cursor-pointer"
            >
              {/* Icons at top */}
              <div className="flex items-center gap-3 mb-7">
                {service.icons.map((Icon, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg bg-gaia-200 dark:bg-gaia-800 border-gaia-400 dark:border-gaia-700 border flex items-center justify-center transition-colors duration-300 dark:group-hover:bg-muted"
                  >
                    <Icon className="h-5 w-5 text-brand-800" />
                  </div>
                ))}
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2  transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {service.description}
              </p>

              {/* View Template link */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground  transition-colors duration-300">
                <span>View Documentation</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
