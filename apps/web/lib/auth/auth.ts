import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";
import { db, authSchema } from "@gaia/db";
import type { SocialProviders } from "better-auth/social-providers";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  // baseUrl: string;
  productionUrl: string;
  secret: string | undefined;
  extraPlugins?: TExtraPlugins;
  socialProviders?: SocialProviders;
  emailVerification?: BetterAuthOptions["emailVerification"];
  emailAndPassword?: BetterAuthOptions["emailAndPassword"];
}): any {
  const config = {
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    secret: options.secret,
    emailVerification: options.emailVerification,
    user: {
      additionalFields: {},
    },
    emailAndPassword: options.emailAndPassword,
    plugins: [
      oAuthProxy({
        productionURL: options.productionUrl,
      }),

      ...(options.extraPlugins ?? []),
    ],
    socialProviders: options.socialProviders,
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
export type AuthUser = Auth["$Infer"]["User"];
