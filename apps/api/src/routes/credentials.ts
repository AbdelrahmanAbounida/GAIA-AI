import {
  and,
  db,
  eq,
  credential,
  CredentialSchema,
  count,
  desc,
} from "@gaia/db";
import { createCredentialSchema, updateCredentialSchema } from "@gaia/db";
import { os } from "@orpc/server";
import { z } from "zod";
import type { AppContext } from "../types";
import { randomBytes } from "crypto";
import { decryptApiKey, encryptApiKey, maskApiKey } from "../utils";

export const createCredential = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/credentials",
    summary: "Create a new credential",
  })
  .input(createCredentialSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      credentialId: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const userId = context.session?.user.id;
    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    // For Ollama, check if a credential already exists
    if (input.provider === "ollama") {
      const existingOllamaCred = await db
        .select()
        .from(credential)
        .where(
          and(
            eq(credential.userId, userId),
            eq(credential.provider, "ollama"),
            eq(credential.credentialType, input.credentialType)
          )
        )
        .limit(1);

      if (existingOllamaCred.length > 0) {
        // Update existing credential to add the new model
        const existing = existingOllamaCred[0];
        const existingModels = (existing.models as string[]) || [];

        // Check if model already exists
        if (input.name && existingModels.includes(input.name)) {
          return {
            success: false,
            message: `Model ${input.name} already exists`,
          };
        }

        // Add new model to the list
        const updatedModels = input.name
          ? [...existingModels, input.name]
          : existingModels;

        await db
          .update(credential)
          .set({
            models: updatedModels,
            updatedAt: new Date(),
          })
          .where(eq(credential.id, existing.id));

        return {
          success: true,
          message: "Model added successfully",
          credentialId: existing.id,
        };
      }

      // Create new Ollama credential with models array
      const credentialId = `cred_${randomBytes(16).toString("hex")}`;
      const encryptedKey = input.apiKey ? encryptApiKey(input.apiKey) : "";

      await db.insert(credential).values({
        id: credentialId,
        userId,
        name: input.name,
        models: input.name ? [input.name] : [],
        provider: input.provider,
        apiKey: encryptedKey,
        dynamicFields: input.dynamicFields,
        credentialType: input.credentialType,
        baseUrl: input.baseUrl || null,
        proxy: input.proxy,
        isValid: input?.isValid ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        message: "Credential created successfully",
        credentialId,
      };
    }

    // For non-Ollama providers, use existing logic
    const existingCredentials = await db
      .select()
      .from(credential)
      .where(
        and(
          eq(credential.userId, userId),
          eq(credential.provider, input.provider),
          eq(credential.credentialType, input.credentialType)
        )
      );

    const existingCredential =
      existingCredentials.find((cred) => cred.isValid) ||
      existingCredentials.find((cred) => cred.apiKey === input.apiKey) ||
      existingCredentials.find((cred) => cred.baseUrl === input.baseUrl);

    if (existingCredential) {
      return {
        success: false,
        message: `Valid credential for ${input.provider} already exists`,
      };
    }

    const encryptedKey = encryptApiKey(input.apiKey);
    const credentialId = `cred_${randomBytes(16).toString("hex")}`;

    await db.insert(credential).values({
      id: credentialId,
      userId,
      name: input.name,
      models: null,
      provider: input.provider,
      apiKey: encryptedKey,
      dynamicFields: input.dynamicFields,
      credentialType: input.credentialType,
      baseUrl: input.baseUrl || null,
      proxy: input.proxy,
      isValid: input?.isValid ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Credential created successfully",
      credentialId,
    };
  });

export const getCredentials = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/credentials",
    summary: "Get credentials for the current user (paginated)",
  })
  .input(
    z.object({
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      credentials: z.array(
        CredentialSchema.extend({
          maskedApiKey: z.string(),
        })
      ),
      nextOffset: z.number().optional(),
      hasMore: z.boolean(),
      total: z.number(),
      message: z.string().optional(),
    })
  )
  .handler(async ({ context, input }) => {
    const userId = context.session?.user.id;

    if (!userId) {
      return {
        success: false,
        credentials: [],
        total: 0,
        hasMore: false,
        message: "Unauthorized",
      };
    }

    const { limit, offset } = input;

    const [rows, totalCount] = await Promise.all([
      db
        .select()
        .from(credential)
        .where(eq(credential.userId, userId))
        .orderBy(desc(credential.createdAt))
        .limit(limit + 1)
        .offset(offset),

      db
        .select({ count: count() })
        .from(credential)
        .where(eq(credential.userId, userId)),
    ]);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const credentials = page.map((cred) => ({
      ...cred,
      maskedApiKey: maskApiKey(decryptApiKey(cred.apiKey)),
      apiKey: decryptApiKey(cred.apiKey),
    }));

    return {
      success: true,
      credentials,
      nextOffset: hasMore ? offset + limit : undefined,
      hasMore,
      total: Number(totalCount[0]?.count ?? 0),
    };
  })
  .callable();

export const getCredential = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/credentials/:id",
    summary: "Get a specific credential",
  })
  .input(
    z.object({
      id: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
      credential: z
        .object({
          id: z.string(),
          provider: z.string(),
          baseUrl: z.string().nullable(),
          models: z.array(z.string()).nullable(),
          isValid: z.boolean(),
          lastValidatedAt: z.date().nullable(),
          createdAt: z.date(),
          maskedApiKey: z.string(),
        })
        .optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const userId = context.session?.user.id;

    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    const [cred] = await db
      .select()
      .from(credential)
      .where(and(eq(credential.id, input.id), eq(credential.userId, userId)))
      .limit(1);

    if (!cred) {
      throw new Error("Credential not found");
    }

    return {
      credential: {
        id: cred.id,
        provider: cred.provider,
        baseUrl: cred.baseUrl,
        models: cred.models as string[] | null,
        isValid: cred.isValid ?? true,
        lastValidatedAt: cred.lastValidatedAt,
        createdAt: cred.createdAt,
        maskedApiKey: maskApiKey(decryptApiKey(cred.apiKey)),
      },
      success: true,
    };
  });

export const updateCredential = os
  .$context<AppContext>()
  .route({
    method: "PATCH",
    path: "/credentials/:id",
    summary: "Update a credential",
  })
  .input(
    z.object({
      id: z.string(),
      data: updateCredentialSchema,
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const userId = context.session?.user.id;

    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    const [existing] = await db
      .select()
      .from(credential)
      .where(and(eq(credential.id, input.id), eq(credential.userId, userId)))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        message: "Credential not found",
      };
    }

    const updateData: any = {
      ...input.data,
      updatedAt: new Date(),
    };

    if (input.data.apiKey) {
      updateData.apiKey = encryptApiKey(input.data.apiKey);
    }

    await db
      .update(credential)
      .set(updateData)
      .where(eq(credential.id, input.id));

    return {
      success: true,
      message: "Credential updated successfully",
    };
  });

export const deleteCredential = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/credentials/:id",
    summary: "Delete a credential",
  })
  .input(
    z.object({
      id: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const userId = context.session?.user.id;

    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    const [existing] = await db
      .select()
      .from(credential)
      .where(and(eq(credential.id, input.id), eq(credential.userId, userId)))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        message: "Credential not found",
      };
    }

    await db.delete(credential).where(eq(credential.id, input.id));

    return {
      success: true,
      message: "Credential deleted successfully",
    };
  });

export const deleteModelFromCredential = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/credentials/:id/models/:modelName",
    summary: "Delete a model from an Ollama credential",
  })
  .input(
    z.object({
      id: z.string(),
      modelName: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input, context }) => {
    const userId = context.session?.user.id;

    if (!userId) {
      return { success: false, message: "Unauthorized" };
    }

    const [existing] = await db
      .select()
      .from(credential)
      .where(and(eq(credential.id, input.id), eq(credential.userId, userId)))
      .limit(1);

    if (!existing) {
      return {
        success: false,
        message: "Credential not found",
      };
    }

    if (existing.provider !== "ollama") {
      return {
        success: false,
        message: "This operation is only for Ollama credentials",
      };
    }

    const existingModels = (existing.models as string[]) || [];
    const updatedModels = existingModels.filter((m) => m !== input.modelName);

    // If no models left, delete the credential
    if (updatedModels.length === 0) {
      await db.delete(credential).where(eq(credential.id, input.id));
      return {
        success: true,
        message: "Credential deleted (no models remaining)",
      };
    }

    // Otherwise update the models list
    await db
      .update(credential)
      .set({
        models: updatedModels,
        updatedAt: new Date(),
      })
      .where(eq(credential.id, input.id));

    return {
      success: true,
      message: "Model removed successfully",
    };
  });

export const CredentialRouter = os
  .$context<AppContext>()
  .tag("Credentials")
  .router({
    create: createCredential,
    list: getCredentials,
    get: getCredential,
    update: updateCredential,
    delete: deleteCredential,
    deleteModelFromCredential,
  });
