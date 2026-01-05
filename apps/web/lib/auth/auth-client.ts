import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "./server";

export const authClient = createAuthClient({
  fetchOptions: {
    onError: (ctx) => {},
  },
  plugins: [inferAdditionalFields<typeof auth>()],
});
