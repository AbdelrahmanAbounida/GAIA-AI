import "server-only";
import { headers } from "next/headers";
import { createRouterClient } from "@orpc/server";
import { appRouter } from "@gaia/api";
import { getServerSession } from "../auth/actions";

const createServerClient = async () => {
  return createRouterClient(appRouter, {
    context: async () => ({
      headers: await headers(),
      session: await getServerSession(),
    }),
  });
};

// Export a function that creates a fresh client each time
export const getOrpcServer = () => {
  if (!globalThis.$client) {
    globalThis.$client = createRouterClient(appRouter, {
      context: async () => ({
        headers: await headers(),
        session: await getServerSession(),
      }),
    });
  }
  return globalThis.$client;
};

export const orpcServer = getOrpcServer();
