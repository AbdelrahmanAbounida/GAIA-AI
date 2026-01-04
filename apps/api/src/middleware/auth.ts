import { ORPCError, os } from "@orpc/server";
import type { AppContext } from "../types";

export const requiredAuthMiddleware = os
  .$context<AppContext>()
  .middleware(async ({ context, next }) => {
    if (!context.session || !context.session?.user) {
      // throw new ORPCError("UNAUTHORIZED");
    }
    // TODO:: here we could get user with api key
    return next({
      context: {
        ...context,
        user: context.session?.user,
      },
    });
  });
