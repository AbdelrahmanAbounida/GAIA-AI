import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";
import { initAuth } from "./auth";

export const auth = initAuth({
  productionUrl: `https://${process.env.VERCEL_URL ?? "localhost:3000"}`,
  secret: process.env.BETTER_AUTH_SECRET,
  extraPlugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    disableSignUp: false,
    autoSignIn: true,
  },
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() })
);

// Types
export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
export type AuthUser = Auth["$Infer"]["User"];
