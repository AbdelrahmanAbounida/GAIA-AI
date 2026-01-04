import type { UIMessage } from "ai";
import { z } from "zod";

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
  attachments: z.array(z.any()).optional(),
});
export type MessageMetadata = z.infer<typeof messageMetadataSchema>;
export type DataPart = { type: "append-message"; message: string };

export type Artifact = {
  id: string;
  type: "code" | "text" | "image" | "audio" | "video";
  language?: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
};

// TODO:: readjust here and in chat
export type CustomUIDataTypes = {
  appendMessage: string;
  addToolApprovalResponse: string;
  artifact: Artifact;
};

export type ChatMessageWithNoTool = UIMessage<
  MessageMetadata,
  CustomUIDataTypes
>;
