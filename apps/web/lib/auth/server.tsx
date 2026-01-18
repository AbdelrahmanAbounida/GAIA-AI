import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";
import { initAuth } from "./auth";
import { emailOTP } from "better-auth/plugins";
import { sendEmail } from "./resend";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

export const auth = initAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  extraPlugins: [
    nextCookies(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          await sendEmail({
            email,
            subject: "Email Verification",
            react: (
              <div className="flex flex-col space-y-4">
                <p className="mt-4">
                  Hi {email}, here is your OTP: <br />{" "}
                  <span className="font-bold">{otp}</span>
                </p>
              </div>
            ),
          });
        } else if (type == "forget-password") {
          // Send the OTP for password reset
          await sendEmail({
            email,
            subject: "Password Reset",
            react: (
              <div>
                <p>
                  Hi , {email} here is your OTP: <br />{" "}
                  <span className="font-bold">{otp}</span>
                </p>
              </div>
            ),
          });
        }
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !!isVercel,
    disableSignUp: false,
    autoSignIn: true,
  },
  socialProviders: isVercel
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },

        github: {
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
      }
    : {},
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() })
);

// Types
export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
export type AuthUser = Auth["$Infer"]["User"];
