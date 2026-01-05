"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { useRouter } from "next/navigation";

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [routeLoading, setrouteLoading] = useState(false);
  const router = useRouter();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/90  backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo className="w-fit" width={10} height={10} />

        {/* Desktop Navigation */}
        {/* <div className="hidde flex-1  justify-center w-full mx-auto items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </div> */}

        <div className="hidden items-center gap-4 md:flex">
          {/* {!user && (
            <Button
              variant="ghost"
              size="tiny"
              className=" dark:hover:bg-gaia-700!"
            >
              Sign In
            </Button>
          )} */}
          <Button
            variant={"brand"}
            size="tiny"
            className="bg-primary h-7 text-xs text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setrouteLoading(true);
              router.push("https://github.com/AbdelrahmanAbounida/gaia-docs"); // TODO::: docs url
            }}
          >
            Get Started
          </Button>
          {/* {user && (
            <UserNav
              showLong={false}
              className="size-4"
              avatarClassName="size-7 text-xs"
            />
          )} */}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/40 bg-background md:hidden"
        >
          <div className="flex flex-col gap-4 px-6 py-4">
            {/* {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))} */}
            <div className="flex flex-col gap-2 pt-4">
              {/* <Button variant="outline" size="sm">
                Sign In
              </Button> */}
              <Button
                size="sm"
                variant={"brand"}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
