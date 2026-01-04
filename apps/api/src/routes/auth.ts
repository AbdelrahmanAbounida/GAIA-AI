import { os } from "@orpc/server";
import { db, eq, user, UserSchema } from "@gaia/db";
import z from "zod";

export const signupWithEmail = os
  .route({
    method: "POST",
    path: "/auth/signup",
    summary: "Sign up a new user",
    tags: ["Authentication"],
  })
  .input(UserSchema)
  .output(
    z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    return {
      id: "28aa6286-48e9-4f23-adea-3486c86acd55",
      email: input.email,
      name: input.name,
    };
  });

export const signinWithEmail = os
  .route({
    method: "POST",
    path: "/auth/signin",
    summary: "Sign in a user",
    tags: ["Authentication"],
  })
  .input(
    z.object({
      email: z.string(),
      password: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
    })
  )
  .handler(async ({ input, context }) => {
    return { success: true };
  });

export const checkEmailExist = os
  .route({
    method: "POST",
    path: "/auth/email-exist",
    summary: "Check if an email exists",
    tags: ["Authentication"],
  })
  .input(
    z.object({
      email: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
    })
  )
  .handler(async ({ input, context }) => {
    const emailExist = await db
      .select()
      .from(user)
      .where(eq(user.email, input.email));
    return { success: emailExist?.length > 0 };
  });

const getUser = os
  .route({
    method: "GET",
    path: "/user",
    summary: "Get the current user",
    tags: ["Authentication"],
  })
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .output(UserSchema)
  .handler(async ({ input }) => {
    const existUser = await db
      .select()
      .from(user)
      .where(eq(user.id, input.userId));
    return existUser[0];
  });
export const authRouter = os.prefix("/auth").router({
  signupWithEmail,
  signinWithEmail,
  checkEmailExist,
  getUser,
});
