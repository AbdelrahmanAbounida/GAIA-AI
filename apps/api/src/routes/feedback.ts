import { and, db, eq, feedback, gte, lt, sql, user, type User } from "@gaia/db";

import { os } from "@orpc/server";
import { z } from "zod";
import { DAILY_FEEDBACKS } from "../ratelimits";
import type { AppContext } from "../types";

export const createFeedback = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/feedback/create",
    summary: "Create a new feedback entry",
    tags: ["Feedback"],
  })
  .input(
    z.object({
      content: z.string().min(3),
      stars: z.number().min(1).max(5),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const dbUser = context.session?.user;

    if (!dbUser) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    // 1. Daily Limit Restriction
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFeedbacks = await db
      .select()
      .from(feedback)
      .where(
        and(
          eq(feedback.userId, dbUser?.id!),
          gte(feedback.createdAt, today),
          lt(feedback.createdAt, tomorrow)
        )
      );

    if (todayFeedbacks.length >= DAILY_FEEDBACKS) {
      return {
        success: false,
        message: `Daily feedback limit reached: ${DAILY_FEEDBACKS}`,
      };
    }

    // 2. Insert feedback
    await db.insert(feedback).values({
      content: input.content,
      useEmail: dbUser?.email!,
      userId: dbUser?.id!,
      totalStars: input.stars,
    });

    // 3. Increment user's feedback count
    await db
      .update(user)
      .set({ totalFeedbacks: sql`${user.totalFeedbacks} + 1` })
      .where(eq(user.id, dbUser?.id!));

    return {
      success: true,
      message: "Feedback submitted successfully",
    };
  });

export const feedBackRouter = os
  .$context<AppContext>()
  .prefix("/feedback")
  .router({
    createFeedback,
  });
