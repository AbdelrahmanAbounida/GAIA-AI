import { smoothStream, streamText, tool, type UIMessageStreamWriter } from "ai";
import type { Artifact } from "./types";
import z from "zod";
import { aiGateway } from "../models";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessageWithNoTool } from "./types";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// TODO:: VIDEO Tool > also check image and audio
const aiModel = createOpenAICompatible({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
  name: "openai",
});

export const createVideoArtifact = ({
  dataStream,
}: {
  dataStream?: UIMessageStreamWriter<ChatMessageWithNoTool>;
}) =>
  tool({
    description: "Generate videos based on a text description using AI",
    inputSchema: z.object({
      prompt: z.string().describe("Description of the video to generate"),
      duration: z
        .number()
        .min(2)
        .max(10)
        .default(5)
        .describe("Duration of video in seconds (2-10)"),
      aspectRatio: z
        .enum(["16:9", "9:16", "1:1"])
        .default("16:9")
        .describe("Video aspect ratio"),
      model: z
        .string()
        .default("google/gemini-2.0-flash-exp")
        .describe("Video generation model to use"),
    }),
    execute: async ({ prompt, duration, aspectRatio, model }) => {
      console.log("✅✅✅✅✅✅✅✅");
      // Generate the video using AI SDK
      const result = streamText({
        model: aiModel("sora-2-2025-10-06"),
        prompt: `Generate a ${duration} second video in ${aspectRatio} aspect ratio: ${prompt}`,
        experimental_transform: smoothStream({ chunking: "word" }),
      });

      let textContent = "";
      const progressArtifactId = uuidv4();

      // Stream progress updates
      for await (const delta of result.fullStream) {
        if (delta.type === "text-delta" && delta.text) {
          textContent += delta.text;

          // Stream progress artifact
          const progressArtifact: Artifact = {
            id: progressArtifactId,
            title: `Generating video: ${prompt.substring(0, 50)}...`,
            content: textContent,
            type: "video",
            metadata: {
              status: "generating",
              progress: textContent,
              duration,
              aspectRatio,
            },
          };

          dataStream?.write({
            type: "data-artifact",
            data: progressArtifact,
            transient: true,
          });
        }

        if (delta.type === "file") {
          console.log("Video file received during stream:", delta.file);
        }
      }

      // After streaming is complete, access the video files
      const generatedFiles = await result.files;

      const generatedVideos = generatedFiles
        .filter((file) => file.mediaType?.startsWith("video/"))
        .map((file) => ({
          mediaType: file.mediaType,
          base64: file.base64,
        }));

      // Validate that we got a video
      if (generatedVideos.length === 0) {
        throw new Error("Failed to generate video - no video was created");
      }

      const finalArtifact: Artifact = {
        id: progressArtifactId,
        title: `Generated: ${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}`,
        content: generatedVideos[0].base64,
        type: "video",
        metadata: {
          status: "complete",
          video: generatedVideos[0],
          mediaType: generatedVideos[0].mediaType,
          duration,
          aspectRatio,
          model,
        },
      };

      dataStream?.write({
        type: "data-artifact",
        data: finalArtifact,
        transient: false,
      });

      return {
        artifact: finalArtifact,
      };
    },
  });
