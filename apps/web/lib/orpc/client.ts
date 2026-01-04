import type { RouterClient } from "@orpc/server";
import { RPCLink } from "@orpc/client/fetch";
import { createORPCClient } from "@orpc/client";
import { appRouter } from "@gaia/api";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

// Client Side client
declare global {
  var $client: RouterClient<typeof appRouter> | undefined;
}

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink is not allowed on the server side.");
    }

    return `${window.location.origin}/api/rpc`;
  },
});

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const orpc: RouterClient<typeof appRouter> =
  globalThis.$client ?? createORPCClient(link);

// React Query Client
export const orpcQueryClient = createTanstackQueryUtils(orpc);
