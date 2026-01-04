import { smoothStream, streamText, tool, type UIMessageStreamWriter } from "ai";
import type { Artifact } from "./types";
import z from "zod";
import { aiGateway } from "../models";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessageWithNoTool } from "./types";

export const createImageArtifact = ({
  dataStream,
}: {
  dataStream?: UIMessageStreamWriter<ChatMessageWithNoTool>;
}) =>
  tool({
    description: "Generate images based on a text description using AI",
    inputSchema: z.object({
      prompt: z.string().describe("Description of the image(s) to generate"),
      numberOfImages: z
        .number()
        .min(1)
        .max(4)
        .default(1)
        .describe("Number of images to generate (1-4)"),
      model: z
        .string()
        .default("google/gemini-2.5-flash-image")
        .describe("Image generation model to use"),
    }),
    execute: async ({ prompt, numberOfImages, model }) => {
      // Generate the image(s) using AI SDK
      const result = streamText({
        model: aiGateway("google/gemini-3-pro-image"),
        prompt: `Render ${numberOfImages} image(s): ${prompt}`,
        experimental_transform: smoothStream({ chunking: "word" }),
      });

      let textContent = "";
      const progressArtifactId = uuidv4();

      // Stream progress updates - consume the stream ONCE
      for await (const delta of result.fullStream) {
        if (delta.type === "text-delta" && delta.text) {
          textContent += delta.text;

          // Stream progress artifact
          const progressArtifact: Artifact = {
            id: progressArtifactId,
            title: `Generating: ${prompt.substring(0, 50)}...`,
            content: textContent,
            type: "image",
            metadata: {
              status: "generating",
              progress: textContent,
            },
          };

          dataStream?.write({
            type: "data-artifact",
            data: progressArtifact,
            transient: true,
          });
        }

        if (delta.type === "file") {
          console.log("File received during stream:", delta.file);
        }
      }

      // After streaming is complete, access the files
      const generatedFiles = await result.files;

      const generatedImages = generatedFiles.map((file) => ({
        mediaType: file.mediaType,
        base64: file.base64,
      }));

      // Validate that we got images
      if (generatedImages.length === 0) {
        throw new Error("Failed to generate images - no images were created");
      }

      // Create and send the final artifact with images to the UI
      const finalArtifact: Artifact = {
        id: progressArtifactId,
        title: `Generated: ${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}`,
        content: generatedImages[0].base64, // TODO::: recheck for multiple image generation
        type: "image",
        metadata: {
          status: "complete",
          images: generatedImages,
          numberOfImages: generatedImages.length,
          model,
        },
      };

      // Send final artifact to UI via dataStream
      dataStream?.write({
        type: "data-artifact",
        data: finalArtifact,
        transient: false,
      });

      // Return minimal data to LLM (no base64 to avoid request size issues!)
      return {
        // success: true,
        // artifactId: progressArtifactId,
        artifact: finalArtifact,
        // count: generatedImages.length,
        // message: `Successfully generated ${generatedImages.length} image(s): ${prompt}`,
        // imageMetadata: generatedImages.map((img, index) => ({
        //   index: index + 1,
        //   mediaType: img.mediaType,
        //   sizeKB: Math.round(img.base64.length / 1024),
        //   base64: img.base64,
        // })),
      };
    },
  });
