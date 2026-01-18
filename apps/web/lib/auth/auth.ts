import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";
import { db, authSchema } from "@gaia/db";
import type { SocialProviders } from "better-auth/social-providers";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  productionUrl: string;
  secret: string | undefined;
  extraPlugins?: TExtraPlugins;
  socialProviders?: SocialProviders;
  emailVerification?: BetterAuthOptions["emailVerification"];
  emailAndPassword?: BetterAuthOptions["emailAndPassword"];
}): any {
  const baseURL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NODE_ENV === "production"
      ? "http://0.0.0.0:3000" // Docker fallback
      : "http://localhost:3000";

  const trustedOrigins = [
    process.env.VERCEL_URL!,
    options.productionUrl!,
    "http://localhost:5679",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:5679",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
  ].filter(Boolean);

  const config = {
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    secret: options.secret,
    emailVerification: options.emailVerification,
    baseURL,
    trustedOrigins,
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
