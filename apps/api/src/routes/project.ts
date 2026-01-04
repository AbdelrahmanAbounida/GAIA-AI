import { os } from "@orpc/server";
import type { AppContext } from "../types";
import {
  and,
  createProjectSchema,
  db,
  eq,
  ilike,
  project,
  ProjectSchema,
  count,
} from "@gaia/db";
import z from "zod";

export const getProjects = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/",
    summary: "Get all projects",
    tags: ["Projects"],
  })
  .input(
    z.object({
      searchWord: z.string().optional(),
      limit: z.number().optional().default(20),
      cursor: z.string().optional().default(""),
      offset: z.number().optional().default(0),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      projects: z.array(ProjectSchema),
      nextCursor: z.string().optional(),
      nextOffset: z.number().optional(),
      hasMore: z.boolean(),
      total: z.number(),
      message: z.string().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    if (!context.session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        projects: [],
        total: 0,
        hasMore: false,
      };
    }

    const userId = context.session?.user.id;

    const { limit, offset, searchWord } = input;

    // Build WHERE clause dynamically
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
        .where(eq(project.userId, context.session?.user.id)),
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
  });

export const getProject = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/:projectId",
    summary: "Get a project",
    tags: ["Projects"],
  })
  .input(
    z.object({
      projectId: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      project: ProjectSchema.optional(),
    })
  )
  .handler(async ({ context, input }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [existProject] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, input.projectId),
          eq(project.userId, context.session?.user.id)
        )
      );

    return { success: true, project: existProject };
  });

export const createProject = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/",
    summary: "Create a new project",
    tags: ["Projects"],
  })
  .input(createProjectSchema.omit({ userId: true }))
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      project: ProjectSchema.optional(),
    })
  )
  .handler(async ({ input, context }) => {
    if (!context.session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    const [newProject] = await db
      .insert(project)
      .values({
        ...input,
        searchType: "hybrid",
        fullTextSearch: "flexsearch",
        userId: context.session?.user.id,
      })
      .returning();

    return { success: true, message: "Project created", project: newProject };
  });

export const deleteProject = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/:projectId",
    summary: "Delete a project",
    tags: ["Projects"],
  })
  .input(z.object({ projectId: z.string() }))
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

    const [foundProject] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, input.projectId),
          eq(project.userId, context.session?.user.id)
        )
      );

    if (!foundProject) {
      return { success: false, message: "Project not found" };
    }

    await db.delete(project).where(eq(project.id, input.projectId));

    return { success: true, message: "Project deleted" };
  });

export const ProjectRouter = os
  .$context<AppContext>()
  .prefix("/projects")
  .router({
    create: createProject,
    get: getProject,
    list: getProjects,
    delete: deleteProject,
  });
