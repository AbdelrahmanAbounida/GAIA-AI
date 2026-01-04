import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "./server";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string,

  fetchOptions: {
    onError: (ctx) => {},
  },
  plugins: [inferAdditionalFields<typeof auth>()],
});
