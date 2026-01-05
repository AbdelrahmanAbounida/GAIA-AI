"use client";

import { motion } from "framer-motion";
import { GithubIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSection() {
  const [routeLoading, setrouteLoading] = useState(false);
  const router = useRouter();

  return (
    <section className={cn("relative  overflow-hidden  pt-32 pb-20")}>
      {/* Background Grid */}
      {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#333333_1px,transparent_1px),linear-gradient(to_bottom,#333333_1px,transparent_1px)] bg-[size:1rem_1rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" /> */}
      {/* Glow Effect */}
      {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-primary/15 blur-[130px] rounded-full" /> */}

      <div className="relative mx-auto max-w-7xl px-6 font-medium!">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 flex items-center gap-2 rounded-full border border-gaia-300 dark:border-primary/30 bg-gaia-100 dark:bg-zinc-100/10 px-4 py-1.5"
          >
            {/* <Sparkles className="h-4 w-4 text-green-600" /> */}
            <GithubIcon className="h-4 w-4 dark:text-white" />
            <span className="text-xs dark:text-white">
              Open Source RAG Framework
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl text-5xl tracking-tight text-black dark:text-white sm:text-6xl lg:text-7xl text-balance"
          >
            Build Intelligent <br />{" "}
            <span className="text-brand-700">AI Agents</span> Your Way
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 max-w-2xl text-md text-gaia-600 dark:text-white/70 leading-relaxed"
          >
            Connect to 10+ LLM providers, 8+ vectorstores, build custom AI
            tools, connect different MCPs and design powerful agents with an
            OpenAI-compatible API. All in one unified framework.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Button
              onClick={() => {
                setrouteLoading(true);
                router.push("/projects");
              }}
              disabled={routeLoading}
              variant={"brand"}
              size="sm"
              className=" text-xs  gap-2"
            >
              Get Started
              {/* <ArrowRight className="h-4 w-4" /> */}
            </Button>
            <Button
              onClick={() => {
                // TODO: Add documentation link
                window.open("https://docs.gaiadocs.com/", "_blank");
              }}
              size="sm"
              variant="outline"
              className=" dark:bg-[#242325]"
            >
              View Documentation
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
