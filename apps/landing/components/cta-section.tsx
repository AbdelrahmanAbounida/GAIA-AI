"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 text-center lg:p-20"
        >
          {/* Background Effects - Now theme-aware */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-size-[3rem_3rem] opacity-50 dark:opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-75 w-125 bg-primary/10 dark:bg-primary/20 blur-[100px] rounded-full" />

          <div className="relative">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl text-balance"
            >
              Start Building with <span className="text-green-700">GAIA</span>{" "}
              Today
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Button variant="brand" size="sm">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Github className="h-4 w-4" />
                View on GitHub
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
