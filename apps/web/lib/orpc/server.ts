import "server-only";

// Server Side client
import { headers } from "next/headers";
import { createRouterClient } from "@orpc/server";
import { appRouter } from "@gaia/api";
import { getServerSession } from "../auth/actions";

globalThis.$client = createRouterClient(appRouter, {
  context: async () => ({
    headers: await headers(),
    session: await getServerSession(),
  }),
});
