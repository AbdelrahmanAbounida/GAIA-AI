import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
  oneTapClient,
} from "better-auth/client/plugins";
import { auth } from "./server";

export const authClient = createAuthClient({
  fetchOptions: {
    onError: (ctx) => {},
  },
  plugins: [
    inferAdditionalFields<typeof auth>(),
    emailOTPClient(),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIB_GOOGLE_CLIENT_ID!,
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
      additionalOptions: {},
      promptOptions: {
        baseDelay: 1000,
        maxAttempts: 5,
      },
    }),
  ],
});
