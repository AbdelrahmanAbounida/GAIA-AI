import type { AppContext } from "../../types";
import { and, db, eq, ilike, project, count } from "@gaia/db";
import { projectSchemas } from "./schema";
import type z from "zod";

export const projectHandlers = {
  getProjects: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof projectSchemas.getProjectsInput>;
  }) => {
    if (!context.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        projects: [],
        total: 0,
        hasMore: false,
      };
    }

    const userId = context.session.user.id;
    const { limit, offset, searchWord } = input;

    const conditions = [eq(project.userId, userId)];

    if (searchWord) {
      conditions.push(ilike(project.name, `%${searchWord}%`));
    }

    const whereClause = and(...conditions);

    const [projects, totalCount] = await Promise.all([
      db
        .select()
        .from(project)
        .where(whereClause)
        .limit(limit + 1)
        .offset(offset),
      db
        .select({ count: count() })
        .from(project)
        .where(eq(project.userId, userId)),
    ]);

    const hasMore = projects.length > limit;
    const projectsToReturn = hasMore ? projects.slice(0, limit) : projects;
    return {
      success: true,
      projects: projectsToReturn,
      nextOffset: hasMore ? offset + limit : undefined,
      hasMore,
      total: Number(totalCount[0]?.count ?? 0),
    };
  },

  getProject: async ({
    context,
    input,
  }: {
    context: AppContext;
    input: z.infer<typeof projectSchemas.getProjectInput>;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [existProject] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, input.projectId),
          eq(project.userId, context.session.user.id)
        )
      );
    if (!existProject) {
      return {
        success: false,
        message: `Project with id ${input.projectId} not found`,
      };
    }

    return { success: true, project: existProject };
  },

  createProject: async ({
    input,
    context,
  }: {
    input: z.infer<typeof projectSchemas.createProjectInput>;
    context: AppContext;
  }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [newProject] = await db
      .insert(project)
      .values({
        ...input,
        searchType: "hybrid",
        fullTextSearch: "flexsearch",
        userId: context.session.user.id,
      })
      .returning();

    return { success: true, message: "Project created", project: newProject };
  },

  deleteProject: async ({
    input,
    context,
  }: {
    input: z.infer<typeof projectSchemas.deleteProjectInput>;
    context: AppContext;
  }): Promise<z.infer<typeof projectSchemas.deleteProjectOutput>> => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [foundProject] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, input.projectId),
          eq(project.userId, context.session.user.id)
        )
      );

    if (!foundProject) {
      return {
        success: false,
        message: `Project with id ${input.projectId} not found`,
      };
    }

    await db.delete(project).where(eq(project.id, input.projectId));

    return { success: true, message: "Project deleted" };
  },
};
