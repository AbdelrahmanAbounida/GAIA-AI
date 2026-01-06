import { db, eq, project, prompt } from "@gaia/db";
import type { AppContext } from "../../types";
import type z from "zod";
import type { promptSchemas } from "./schema";

export const promptHandlers = {
  async getPrompt({
    input,
    context,
  }: {
    input: z.infer<typeof promptSchemas.getPromptInput>;
    context: AppContext;
  }) {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [existProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, input.projectId));

    if (!existProject) {
      return {
        success: false,
        message: `Project with id ${input.projectId} not found`,
      };
    }

    const [existPrompt] = await db
      .select()
      .from(prompt)
      .where(eq(prompt.projectId, input.projectId));

    return { success: true, prompt: existPrompt };
  },

  async createPrompt({
    input,
    context,
  }: {
    input: z.infer<typeof promptSchemas.createPromptInput>;
    context: AppContext;
  }) {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [existProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, input.projectId));

    if (!existProject) {
      return {
        success: false,
        message: `Project with id ${input.projectId} not found`,
      };
    }

    const [promptExist] = await db
      .select()
      .from(prompt)
      .where(eq(prompt.projectId, input.projectId));

    if (promptExist) {
      return { success: false, message: "Prompt already exists" };
    }

    await db.insert(prompt).values({
      projectId: input.projectId,
      content: input.prompt,
    });

    return { success: true, message: "Prompt created successfully" };
  },

  async updatePrompt({
    input,
    context,
  }: {
    input: z.infer<typeof promptSchemas.updatePromptInput>;
    context: AppContext;
  }) {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [existProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, input.projectId));

    if (!existProject) {
      return {
        success: false,
        message: `Project with id ${input.projectId} not found`,
      };
    }

    const [promptExist] = await db
      .select()
      .from(prompt)
      .where(eq(prompt.projectId, input.projectId));

    if (!promptExist) {
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
  },

  async deletePrompt({
    input,
    context,
  }: {
    input: z.infer<typeof promptSchemas.deletePromptInput>;
    context: AppContext;
  }) {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [existProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, input.projectId));

    if (!existProject) {
      return {
        success: false,
        message: `Project with id ${input.projectId} not found`,
      };
    }

    await db.delete(prompt).where(eq(prompt.projectId, input.projectId));

    return { success: true, message: "Prompt deleted successfully" };
  },
};
