"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "../logo";

const footerLinks = {
  Resources: ["Documentation", "API Reference"],
  Product: ["Features", "Integrations"],
  Company: ["GitHub", "About"],
};

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="border-t border-border bg-card py-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo isIcon={false} />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              The open-source RAG framework for building intelligent AI Agents.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GAIA. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for the AI community
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
