import {
  experimental_generateSpeech as generateSpeech,
  tool,
  type UIMessageStreamWriter,
} from "ai";
import z from "zod";
import type { ChatMessageWithNoTool } from "./types";
import { createOpenAI } from "@ai-sdk/openai";

// TODO:: audio
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const createAudioArtifact = ({
  dataStream,
}: {
  dataStream?: UIMessageStreamWriter<ChatMessageWithNoTool>;
}) =>
  tool({
    description: "Generate audio based on a text description using AI",
    inputSchema: z.object({
      prompt: z.string().describe("Description of the audio to generate"),
      duration: z
        .number()
        .min(2)
        .max(10)
        .default(5)
        .describe("Duration of audio in seconds (2-10)"),
      model: z
        .string()
        .default("google/gemini-2.0-flash-exp")
        .describe("audio generation model to use"),
    }),
    execute: async ({ prompt, duration, model }) => {
      const result = await generateSpeech({
        model: openai.speech("tts-1"),
        text: prompt,
        outputFormat: "mp3",
        language: "en",
      });

      return {};
    },
  });
