import { os, ORPCError } from "@orpc/server";
import type { AppContext } from "../types";
import { apikey, db, eq, user } from "@gaia/db";

export const requireApiKeyMiddleware = os
  .$context<AppContext>()
  .middleware(async ({ context, next }) => {
    const headerApiKey = context.headers?.["gaia-api-key"];

    if (!headerApiKey) {
      throw new ORPCError("UNAUTHORIZED", { message: "Missing apikey" });
    }

    const [validKey] = await db
      .select()
      .from(apikey)
      .where(eq(apikey.value, headerApiKey))
      .limit(1);

    if (!validKey) {
      throw new ORPCError("UNAUTHORIZED", { message: "Invalid apikey" });
    }
    console.log({ validKey });
    // get apikey user
    const [apikeyUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, validKey.userId))
      .limit(1);

    console.log({ apikeyUser });

    if (!apikeyUser) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Invalid user assigned to apikey",
      });
    }

    return next({
      context: {
        session: {
          ...context.session,
          user: apikeyUser,
        },
        ...context.headers,
      },
    });
  });
