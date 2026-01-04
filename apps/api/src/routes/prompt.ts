import { os } from "@orpc/server";
import type { AppContext } from "../types";
import { z } from "zod";
import { and, db, eq, prompt, PromptSchema } from "@gaia/db";

export const getPrompt = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/prompt",
    summary: "Get all prompts",
    tags: ["Prompt"],
  })
  .input(
    z.object({
      projectId: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      prompt: PromptSchema.optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    const [existPrompt] = await db
      .select()
      .from(prompt)
      .where(eq(prompt.projectId, input.projectId));
    return { success: true, prompt: existPrompt };
  });

export const createPrompt = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/prompt",
    summary: "Create a new prompt",
    tags: ["Prompt"],
  })
  .input(
    z.object({
      projectId: z.string(),
      prompt: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    // first check if prompt exist return
    const [promptExist] = await db
      .select()
      .from(prompt)
      .where(and(eq(prompt.projectId, input.projectId)));
    if (promptExist) {
      return { success: false, message: "Prompt already exist" };
    }
    await db.insert(prompt).values({
      projectId: input.projectId,
      content: input.prompt,
    });
    return { success: true, message: "Prompt created successfully" };
  });

export const updatePrompt = os
  .$context<AppContext>()
  .route({
    method: "PATCH",
    path: "/prompt",
    summary: "Update a prompt",
    tags: ["Prompt"],
  })
  .input(
    z.object({
      projectId: z.string(),
      prompt: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    // first check if prompt exist return
    const [promptExist] = await db
      .select()
      .from(prompt)
      .where(and(eq(prompt.projectId, input.projectId)));
    if (!promptExist) {
      // create one
      await db.insert(prompt).values({
        projectId: input.projectId,
        content: input.prompt,
      });
      return { success: true, message: "Prompt created successfully" };
    }
    await db
      .update(prompt)
      .set({
        content: input.prompt,
      })
      .where(eq(prompt.id, promptExist.id));
    return { success: true, message: "Prompt updated successfully" };
  });

export const deletePrompt = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/prompt",
    summary: "Delete a prompt",
    tags: ["Prompt"],
  })
  .input(
    z.object({
      projectId: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }
    await db.delete(prompt).where(eq(prompt.projectId, input.projectId));
    return { success: true, message: "Prompt deleted successfully" };
  });

export const PromptRouter = os.$context<AppContext>().router({
  get: getPrompt,
  create: createPrompt,
  update: updatePrompt,
  delete: deletePrompt,
});
