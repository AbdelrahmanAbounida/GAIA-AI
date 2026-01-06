import { os } from "@orpc/server";
import type { AppContext } from "../../types";
import { credentialHandlers } from "./handler";
import { credentialSchemas } from "./schema";
import { credentialSpecs } from "./spec";

export const createCredential = os
  .$context<AppContext>()
  .route({
    method: "POST",
    path: "/credentials",
    summary: "Create a new credential",
    spec: credentialSpecs.createCredential,
  })
  .input(credentialSchemas.createCredentialInput)
  .output(credentialSchemas.createCredentialOutput)
  .handler(credentialHandlers.createCredential);

export const getCredentials = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/credentials",
    summary: "Get credentials for the current user (paginated)",
    spec: credentialSpecs.getCredentials,
  })
  .input(credentialSchemas.getCredentialsInput)
  .output(credentialSchemas.getCredentialsOutput)
  .handler(credentialHandlers.getCredentials)
  .callable();

export const getCredential = os
  .$context<AppContext>()
  .route({
    method: "GET",
    path: "/credentials/{id}",
    summary: "Get a specific credential",
    spec: credentialSpecs.getCredential,
  })
  .input(credentialSchemas.getCredentialInput)
  .output(credentialSchemas.getCredentialOutput)
  .handler(credentialHandlers.getCredential);

export const updateCredential = os
  .$context<AppContext>()
  .route({
    method: "PATCH",
    path: "/credentials/{id}",
    summary: "Update a credential",
    spec: credentialSpecs.updateCredential,
  })
  .input(credentialSchemas.updateCredentialInput)
  .output(credentialSchemas.updateCredentialOutput)
  .handler(credentialHandlers.updateCredential);

export const deleteCredential = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/credentials/{id}",
    summary: "Delete a credential",
    spec: credentialSpecs.deleteCredential,
  })
  .input(credentialSchemas.deleteCredentialInput)
  .output(credentialSchemas.deleteCredentialOutput)
  .handler(credentialHandlers.deleteCredential);

export const deleteModelFromCredential = os
  .$context<AppContext>()
  .route({
    method: "DELETE",
    path: "/credentials/{id}/models/{modelName}",
    summary: "Delete a model from an Ollama credential",
    spec: credentialSpecs.deleteModelFromCredential,
  })
  .input(credentialSchemas.deleteModelFromCredentialInput)
  .output(credentialSchemas.deleteModelFromCredentialOutput)
  .handler(credentialHandlers.deleteModelFromCredential);

export const CredentialRouter = os
  .$context<AppContext>()
  .prefix("/credentials")
  .tag("Credentials")
  .router({
    create: createCredential,
    list: getCredentials,
    get: getCredential,
    update: updateCredential,
    delete: deleteCredential,
    deleteModelFromCredential,
  });
