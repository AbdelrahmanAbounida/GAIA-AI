import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { projectHandlers } from "./handler";
import { projectSchemas } from "./schema";
import { projectSpecs } from "./spec";

export const getProjects = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/projects",
    summary: "Get all projects",
    spec: projectSpecs.getProjects,
  })
  .input(projectSchemas.getProjectsInput)
  .output(projectSchemas.getProjectsOutput)
  .handler(projectHandlers.getProjects);

export const getProject = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/projects/{projectId}",
    summary: "Get a project",
    spec: projectSpecs.getProject,
  })
  .input(projectSchemas.getProjectInput)
  .output(projectSchemas.getProjectOutput)
  .handler(projectHandlers.getProject);

export const createProject = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/projects",
    summary: "Create a new project",
    spec: projectSpecs.createProject,
  })
  .input(projectSchemas.createProjectInput)
  .output(projectSchemas.createProjectOutput)
  .handler(projectHandlers.createProject);

export const deleteProject = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/projects/{projectId}",
    summary: "Delete a project",
    spec: projectSpecs.deleteProject,
  })
  .input(projectSchemas.deleteProjectInput)
  .output(projectSchemas.deleteProjectOutput)
  .handler(projectHandlers.deleteProject);

export const ProjectRouter = os
  .$context<AppContext>()
  .prefix("/projects")
  .router({
    create: createProject,
    get: getProject,
    list: getProjects,
    delete: deleteProject,
  });
