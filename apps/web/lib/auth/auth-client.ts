import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
  oneTapClient,
} from "better-auth/client/plugins";
import { auth } from "./server";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

export const authClient = createAuthClient({
  fetchOptions: {
    onError: (ctx) => {},
  },
  plugins: [
    inferAdditionalFields<typeof auth>(),
    emailOTPClient(),
    ...(isVercel
      ? [
          oneTapClient({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            autoSelect: false,
            cancelOnTapOutside: true,
            context: "signin",
            additionalOptions: {},
            promptOptions: {
              baseDelay: 1000,
              maxAttempts: 5,
            },
          }),
        ]
      : []),
  ],
});
