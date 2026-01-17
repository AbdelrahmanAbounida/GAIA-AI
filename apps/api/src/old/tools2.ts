// import { os } from "@orpc/server";
// import type { AppContext } from "../types";
// import { z } from "zod";
// import { db, eq, tool, ToolSchema } from "@gaia/db";
// import { getPackageManager } from "../lib/package-manager";
// import { ToolCodeValidator } from "../lib/tool-validator";

// /**
//  * Validate tool code before creation/update
//  */
// export const validateToolCode = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/tools/validate",
//     summary: "Validate tool code",
//     tags: ["Tools"],
//   })
//   .input(
//     z.object({
//       code: z.string(),
//       language: z.enum(["javascript", "python"]),
//     })
//   )
//   .output(
//     z.object({
//       valid: z.boolean(),
//       errors: z.array(z.string()),
//       warnings: z.array(z.string()),
//       dependencies: z.array(z.string()),
//       usesAiSdk: z.boolean(),
//       usesExternalApi: z.boolean(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     const validation = ToolCodeValidator.validate(input.code, input.language);
//     return validation;
//   });

// /**
//  * Check if dependencies are installed
//  */
// export const checkDependencies = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/tools/dependencies/check",
//     summary: "Check if dependencies are installed",
//     tags: ["Tools"],
//   })
//   .input(
//     z.object({
//       dependencies: z.array(z.string()),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       dependencies: z.array(
//         z.object({
//           name: z.string(),
//           installed: z.boolean(),
//           globallyInstalled: z.boolean(),
//         })
//       ),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     const packageManager = getPackageManager();
//     const dependencyInfo = await packageManager.getDependenciesInfo(
//       input.dependencies
//     );

//     return {
//       success: true,
//       dependencies: dependencyInfo,
//     };
//   });

// /**
//  * Install dependencies
//  */
// export const installDependencies = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/tools/dependencies/install",
//     summary: "Install tool dependencies",
//     tags: ["Tools"],
//   })
//   .input(
//     z.object({
//       dependencies: z.array(z.string()),
//       dev: z.boolean().optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       output: z.string().optional(),
//       error: z.string().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     const packageManager = getPackageManager();

//     // First validate packages exist
//     const validation = await packageManager.validatePackages(
//       input.dependencies
//     );

//     if (validation.invalid.length > 0) {
//       return {
//         success: false,
//         message: `Invalid packages: ${validation.invalid.join(", ")}`,
//       };
//     }

//     // Install packages
//     const result = await packageManager.installPackages(input.dependencies, {
//       dev: input.dev,
//     });

//     return {
//       success: result.success,
//       message: result.success
//         ? "Dependencies installed successfully"
//         : "Failed to install dependencies",
//       output: result.output,
//       error: result.error,
//     };
//   });

// /**
//  * Create a new tool with validation and dependency management
//  */
// export const createTool = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/tools",
//     summary: "Create a new tool",
//     tags: ["Tools"],
//   })
//   .input(
//     z.object({
//       projectId: z.string(),
//       name: z.string(),
//       description: z.string(),
//       language: z.enum(["javascript", "python"]),
//       dependencies: z.array(z.string()),
//       code: z.string(),
//       usesAiSdk: z.boolean().optional(),
//       usesExternalApi: z.boolean().optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       toolId: z.string().optional(),
//       validation: z
//         .object({
//           errors: z.array(z.string()),
//           warnings: z.array(z.string()),
//         })
//         .optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     // Validate code first
//     const validation = ToolCodeValidator.validate(input.code, input.language);

//     if (!validation.valid) {
//       return {
//         success: false,
//         message: "Code validation failed",
//         validation: {
//           errors: validation.errors,
//           warnings: validation.warnings,
//         },
//       };
//     }

//     // Check dependencies
//     const packageManager = getPackageManager();
//     const depsInfo = await packageManager.getDependenciesInfo(
//       input.dependencies
//     );
//     const missingDeps = depsInfo.filter(
//       (d) => !d.installed && !d.globallyInstalled
//     );

//     if (missingDeps.length > 0) {
//       // Auto-install missing dependencies
//       const installResult = await packageManager.installPackages(
//         missingDeps.map((d) => d.name)
//       );

//       if (!installResult.success) {
//         return {
//           success: false,
//           message: `Failed to install dependencies: ${installResult.error}`,
//         };
//       }
//     }

//     // Create the tool
//     const [newTool] = await db
//       .insert(tool)
//       .values({
//         name: input.name,
//         description: input.description,
//         language: input.language,
//         enabled: true,
//         projectId: input.projectId,
//         code: input.code,
//         dependencies: input.dependencies,
//       })
//       .returning();

//     return {
//       success: true,
//       message: "Tool created successfully",
//       toolId: newTool.id,
//       validation: {
//         errors: [],
//         warnings: validation.warnings,
//       },
//     };
//   });

// /**
//  * Update a tool
//  */
// export const updateTool = os
//   .$context<AppContext>()
//   .route({
//     method: "PUT",
//     path: "/tools/:id",
//     summary: "Update a tool",
//     tags: ["Tools"],
//   })
//   .input(
//     z.object({
//       toolId: z.string(),
//       name: z.string().optional(),
//       description: z.string().optional(),
//       code: z.string().optional(),
//       dependencies: z.array(z.string()).optional(),
//       language: z.enum(["javascript", "python"]).optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       validation: z
//         .object({
//           errors: z.array(z.string()),
//           warnings: z.array(z.string()),
//         })
//         .optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     // Get existing tool
//     const [existingTool] = await db
//       .select()
//       .from(tool)
//       .where(eq(tool.id, input.toolId));

//     if (!existingTool) {
//       return {
//         success: false,
//         message: "Tool not found",
//       };
//     }

//     // Validate code if provided
//     if (input.code) {
//       const language = input.language || existingTool.language;
//       const validation = ToolCodeValidator.validate(
//         input.code,
//         language || "javascript"
//       );

//       if (!validation.valid) {
//         return {
//           success: false,
//           message: "Code validation failed",
//           validation: {
//             errors: validation.errors,
//             warnings: validation.warnings,
//           },
//         };
//       }
//     }

//     // Handle dependency changes
//     if (input.dependencies) {
//       const oldDeps = (existingTool.dependencies as string[]) || [];
//       const newDeps = input.dependencies;

//       // Find new dependencies to install
//       const depsToAdd = newDeps.filter((d) => !oldDeps.includes(d));

//       if (depsToAdd.length > 0) {
//         const packageManager = getPackageManager();
//         const installResult = await packageManager.installPackages(depsToAdd);

//         if (!installResult.success) {
//           return {
//             success: false,
//             message: `Failed to install new dependencies: ${installResult.error}`,
//           };
//         }
//       }

//       // Find removed dependencies (clean up if not used elsewhere)
//       const depsToRemove = oldDeps.filter((d) => !newDeps.includes(d));

//       if (depsToRemove.length > 0) {
//         const packageManager = getPackageManager();

//         // Check if any other tools use these dependencies
//         const checkUsage = async (dep: string) => {
//           const otherTools = await db
//             .select()
//             .from(tool)
//             .where(eq(tool.projectId, existingTool.projectId));

//           return otherTools.some(
//             (t) =>
//               t.id !== input.toolId &&
//               ((t.dependencies as string[]) || []).includes(dep)
//           );
//         };

//         await packageManager.uninstallPackages(depsToRemove, checkUsage);
//       }
//     }

//     // Update the tool
//     const updateData: any = {};
//     if (input.name) updateData.name = input.name;
//     if (input.description) updateData.description = input.description;
//     if (input.code) updateData.code = input.code;
//     if (input.dependencies) updateData.dependencies = input.dependencies;
//     if (input.language) updateData.language = input.language;

//     await db.update(tool).set(updateData).where(eq(tool.id, input.toolId));

//     return {
//       success: true,
//       message: "Tool updated successfully",
//     };
//   });

// /**
//  * Delete a tool and clean up dependencies
//  */
// export const deleteTool = os
//   .$context<AppContext>()
//   .route({
//     method: "DELETE",
//     path: "/tools/:id",
//     summary: "Delete a tool",
//     tags: ["Tools"],
//   })
//   .input(z.object({ id: z.string(), projectId: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//       removedDependencies: z.array(z.string()).optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     // Get the tool to be deleted
//     const [toolToDelete] = await db
//       .select()
//       .from(tool)
//       .where(eq(tool.id, input.id));

//     if (!toolToDelete) {
//       return {
//         success: false,
//         message: "Tool not found",
//       };
//     }

//     const dependencies = (toolToDelete.dependencies as string[]) || [];

//     // Delete the tool
//     await db.delete(tool).where(eq(tool.id, input.id));

//     // Clean up dependencies if not used by other tools
//     if (dependencies.length > 0) {
//       const packageManager = getPackageManager();

//       const checkUsage = async (dep: string) => {
//         const otherTools = await db
//           .select()
//           .from(tool)
//           .where(eq(tool.projectId, input.projectId));

//         return otherTools.some((t) =>
//           ((t.dependencies as string[]) || []).includes(dep)
//         );
//       };

//       const result = await packageManager.uninstallPackages(
//         dependencies,
//         checkUsage
//       );

//       return {
//         success: true,
//         message: "Tool deleted successfully",
//         removedDependencies: result.removed,
//       };
//     }

//     return {
//       success: true,
//       message: "Tool deleted successfully",
//     };
//   });

// /**
//  * List all tools for a project
//  */
// export const listTools = os
//   .$context<AppContext>()
//   .route({
//     method: "GET",
//     path: "/tools",
//     summary: "List all tools",
//     tags: ["Tools"],
//   })
//   .input(z.object({ projectId: z.string() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       tools: z.array(ToolSchema).optional(),
//       message: z.string().optional(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     const tools = await db
//       .select()
//       .from(tool)
//       .where(eq(tool.projectId, input.projectId));

//     return {
//       success: true,
//       tools,
//     };
//   });

// /**
//  * Toggle tool activation
//  */
// export const triggerToolActivation = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/tools/:id/activate",
//     summary: "Activate/deactivate a tool",
//     tags: ["Tools"],
//   })
//   .input(z.object({ toolId: z.string(), activeState: z.boolean() }))
//   .output(
//     z.object({
//       success: z.boolean(),
//       message: z.string(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     await db
//       .update(tool)
//       .set({ enabled: input.activeState })
//       .where(eq(tool.id, input.toolId));

//     return {
//       success: true,
//       message: `Tool ${input.activeState ? "activated" : "deactivated"} successfully`,
//     };
//   });

// /**
//  * Generate tool template
//  */
// export const generateToolTemplate = os
//   .$context<AppContext>()
//   .route({
//     method: "POST",
//     path: "/tools/template",
//     summary: "Generate a tool code template",
//     tags: ["Tools"],
//   })
//   .input(
//     z.object({
//       name: z.string(),
//       description: z.string(),
//       language: z.enum(["javascript", "python"]),
//       usesAiSdk: z.boolean().optional(),
//       usesExternalApi: z.boolean().optional(),
//     })
//   )
//   .output(
//     z.object({
//       success: z.boolean(),
//       code: z.string(),
//     })
//   )
//   .handler(async ({ input, context }) => {
//     if (!context.session?.user) {
//       throw new Error("Unauthorized");
//     }

//     const template = ToolCodeValidator.generateTemplate(input);

//     return {
//       success: true,
//       code: template,
//     };
//   });

// // Export router
// export const ToolsRouter = os.$context<AppContext>().router({
//   validateToolCode,
//   checkDependencies,
//   installDependencies,
//   createTool,
//   updateTool,
//   deleteTool,
//   listTools,
//   triggerToolActivation,
//   generateToolTemplate,
// });
