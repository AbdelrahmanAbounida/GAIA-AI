import { smoothStream, streamText, tool, type UIMessageStreamWriter } from "ai";
import type { Artifact } from "./types";
import z from "zod";
import { aiGateway } from "../models";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessageWithNoTool } from "./types";

export const createCodeArtifact = ({
  dataStream,
}: {
  dataStream?: UIMessageStreamWriter<ChatMessageWithNoTool>;
}) =>
  tool({
    description: "Create a code artifact with generated code",
    inputSchema: z.object({
      description: z.string().describe("Description of the code to generate"),
      language: z
        .enum(["python", "javascript", "typescript", "html", "css"])
        .default("python"),
    }),
    execute: async ({ description, language }) => {
      const systemPrompt = getSystemPrompt(language);
      const userPrompt = description || "Generate a simple code example";

      const { fullStream } = streamText({
        model: aiGateway("gpt-3.5-turbo"),
        system: systemPrompt,
        prompt: userPrompt,
        experimental_transform: smoothStream({ chunking: "word" }),
      });

      let content = "";

      // Stream and accumulate the text content
      for await (const delta of fullStream) {
        if (delta.type === "text-delta" && delta.text) {
          content += delta.text;

          // Stream updates to the artifact in real-time
          const artifact: Artifact = {
            id: uuidv4(),
            title: description || "Code Artifact",
            content: content,
            type: "code",
            language,
          };

          dataStream?.write({
            type: "data-artifact",
            data: artifact,
            transient: true,
          });
        }
      }

      // Validate that we got content
      if (!content || content.trim().length === 0) {
        throw new Error(
          "Failed to generate code artifact - no content generated"
        );
      }

      // Return the final artifact
      const finalArtifact: Artifact = {
        id: uuidv4(),
        title: description || "Code Artifact",
        content: content.trim(),
        type: "code",
        language,
      };

      return {
        artifact: finalArtifact,
      };
    },
  });

const getSystemPrompt = (language: string): string => {
  const baseInstructions = `You are a code generator. Output ONLY raw, runnable code. Do NOT include explanations, markdown, or backticks. Write clean, readable, self-contained code with comments where helpful.`;

  const languageSpecific = {
    python: `Use Python 3 syntax. Avoid external dependencies, input(), file/network access, and infinite loops. Keep snippets concise.`,

    javascript: `Use modern ES6+ syntax with const/let. Include console.log for outputs. Avoid DOM manipulation and infinite loops.`,

    typescript: `Use ES6+ syntax with proper types. Include console.log for outputs. Avoid DOM manipulation and infinite loops.`,

    html: `Create valid, semantic HTML5 with DOCTYPE, html, head, body. Keep code clean and well-formatted.`,

    css: `Use modern CSS with meaningful class names. Organize rules logically and include comments where helpful.`,
  };

  return (
    baseInstructions +
    "\n" +
    (languageSpecific[language as keyof typeof languageSpecific] ||
      languageSpecific.python)
  );
};
