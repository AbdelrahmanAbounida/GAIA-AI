import { generateUUID } from "@/lib/utils";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
  createUIMessageStream,
  JsonToSseTransformStream,
  tool,
  Tool,
} from "ai";
import { z } from "zod";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { orpc } from "@/lib/orpc/client";
import { getMCPManager } from "@gaia/ai/mcp";
import {
  buildDynamicTools,
  createCodeArtifact,
  createImageArtifact,
  createVideoArtifact,
} from "@gaia/ai/tools";

export const maxDuration = 30;

// TODO:: remove
const aiGateway = createOpenAICompatible({
  name: "openai",
  apiKey: "vck_2Z7c547Js4eb8e4sj8b1AYRsJQyTamv1BgRNyPVBhBMBRdk2Aj0ipmyJ",
  baseURL: "https://ai-gateway.vercel.sh/v1",
});

export async function POST(req: Request) {
  const mcpManager = getMCPManager();
  const connectedServerIds: string[] = [];

  try {
    const {
      messages,
      projectId,
      model,
      chatId,
      webSearch = false,
    }: {
      messages: UIMessage[];
      model?: string;
      webSearch?: boolean;
      chatId?: string;
      projectId: string;
    } = await req.json();

    // Create chat on first message
    let chat;
    if (messages?.length === 1) {
      chat = await orpc.authed.chat.create({
        name: getUserDescriptionFromMessages(messages).slice(0, 50),
        chatId,
      });
    }

    // create user message
    await orpc.authed.chat.createMessage({
      id: messages.at(-1)?.id,
      chatId: chatId || chat?.chat?.id,
      role: "user",
      parts: messages.at(-1)?.parts,
      attachments: [],
    });

    // Load Dynamic tools
    const res = await orpc.authed.tools.listTools({ projectId });
    const activeTools = res?.tools || [];
    const dynamicTools = buildDynamicTools(
      activeTools.filter((tool) => tool.code !== null) as any
    );

    // Load MCP servers configuration
    const res2 = await orpc.authed.mcp.listMCPServers({ projectId });
    const activeMCPs =
      res2?.servers?.filter((server) => server.status != "disconnected") || [];

    // Connect to MCP servers and collect tools
    const mcpTools: Record<string, Tool> = {};
    const mcpToolDescriptions: string[] = [];
    const mcpResources: Array<{ serverName: string; resources: any }> = [];
    const mcpPrompts: Array<{ serverName: string; prompts: any }> = [];

    if (activeMCPs.length > 0) {
      const { successful, failed } =
        await mcpManager.connectMultiple(activeMCPs);

      if (failed.length > 0) {
        console.warn("⚠ Some MCP servers failed to connect:", failed);
      }

      // Collect tools, resources, and prompts from connected servers
      for (const server of activeMCPs) {
        const client = mcpManager.getConnection(server.id);
        if (client) {
          connectedServerIds.push(server.id);

          try {
            // Get tools
            const tools = await mcpManager.listTools(server);
            Object.entries(tools).forEach(([name, tool]) => {
              const prefixedName = `${server.name.replace(" ", "_")}_${name.replace(" ", "_")}`;
              mcpTools[prefixedName] = tool;

              // Collect tool descriptions for system prompt
              const toolDesc = (tool as any).description || name;
              mcpToolDescriptions.push(`- ${prefixedName}: ${toolDesc}`);
            });

            // Get resources
            try {
              const resources = await mcpManager.listResources(server);
              mcpResources.push({
                serverName: server.name,
                resources,
              });
            } catch (err) {
              console.warn(
                `Failed to list resources from ${server.name}:`,
                err
              );
            }

            // Get prompts
            try {
              const prompts = await mcpManager.listPrompts(server);
              mcpPrompts.push({
                serverName: server.name,
                prompts,
              });
            } catch (err) {
              // console.warn(`Failed to list prompts from ${server.name}:`, err);
            }
          } catch (error) {
            // console.error(
            //   `Failed to load capabilities from ${server.name}:`,
            //   error
            // );
          }
        }
      }
    }

    // Combine all tools (RAG + custom tools + MCP tools)
    const allTools: Record<string, Tool> = {
      ragTool: ragTool({ projectId }),
      ...dynamicTools.reduce(
        (acc, { name, tool }) => {
          acc[`${name.replace(" ", "_")}`] = tool;
          return acc;
        },
        {} as Record<string, Tool>
      ),
      ...mcpTools,
    };

    // Build system prompt with available resources and prompts
    // TODO:: move to a seprate file
    let systemPrompt = `You are a helpful AI assistant. You MUST use tools to answer questions - do NOT make up information.

CRITICAL RULES:
1. When you don't know something, you MUST use available tools to find the answer
2. NEVER guess or make up information - if you're unsure, use a tool
3. If no tool can help, explicitly say "I don't have access to that information"
4. Always call tools BEFORE answering, not after
5. if You Dont have enough information to answer the question (use RagTool first, then check other useful tools)

AVAILABLE TOOLS:
1. ragTool - Search indexed documents, knowledge base, preferences, and stored project data
${mcpToolDescriptions.length > 0 ? `2. MCP Tools:\n${mcpToolDescriptions.join("\n")}` : ""}

2. MCP Tools 
use them in case the ragTool returns no results useful for the question

WHEN TO USE EACH TOOL:

**ragTool** - Use when the question is about:
- User preferences, settings, or stored data
- Project-specific documentation or knowledge
- Previously uploaded documents or indexed content
- Any information that might be in the knowledge base

**MCP Tools** - Use when:
- The question matches the tool's description/capability
- You need external data, APIs, or system access
- ragTool returned no results but the question could be answered by an MCP tool
- The user explicitly asks about something an MCP tool can do

WORKFLOW:
1. Read the user's question carefully
2. Determine which tool(s) could help answer it
3. Call the appropriate tool(s) - you can use multiple tools if needed
4. Read the tool results thoroughly
5. Synthesize a natural language answer based on the tool results
6. If tools return no relevant information, say so - don't make things up

RESPONSE GUIDELINES:
- Always provide a final answer after using tools
- Be concise and direct
- Don't explain which tools you used unless asked
- If you used a tool and it returned useful information, use that information
- If tools returned nothing useful, admit you don't have the information

ARTIFACTS:
${artifactsPrompt}

When to create artifacts:
- User asks you to write code, create a component, build a function, etc.
- Code is substantial enough to be saved and referenced (20+ lines)
- Code is meant to be used or modified by the user
- Creating visualizations, utilities, or complete programs

Artifact structure in response:
{
  "type": "artifact",
  "artifact": {
    "id": "unique-id",
    "type": "code",
    "title": "Descriptive Title",
    "language": "typescript|javascript|python|tsx|css|markdown",
    "content": "... full code here ..."
  }
}

Example: If user asks "create a React component for a todo list", you would:
1. Provide a brief explanation
2. Include the artifact with the complete code
3. Explain how to use it if needed`;

    if (mcpResources.length > 0) {
      systemPrompt += `\n\nAVAILABLE MCP RESOURCES:`;
      mcpResources.forEach(({ serverName, resources }) => {
        const resourceList = resources.resources || [];
        if (resourceList.length > 0) {
          systemPrompt += `\n\nFrom ${serverName}:`;
          resourceList.forEach((r: any) => {
            systemPrompt += `\n- ${r.name || r.uri}: ${r.description || "No description"}`;
          });
        }
      });
    }

    if (mcpPrompts.length > 0) {
      systemPrompt += `\n\nAVAILABLE MCP PROMPTS:`;
      mcpPrompts.forEach(({ serverName, prompts }) => {
        const promptList = prompts.prompts || [];
        if (promptList.length > 0) {
          systemPrompt += `\n\nFrom ${serverName}:`;
          promptList.forEach((p: any) => {
            systemPrompt += `\n- ${p.name}: ${p.description || "No description"}`;
          });
        }
      });
    }
    // Create the UI message stream
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Create the streamText result
        const result = streamText({
          model: aiGateway(model || "gpt-3.5-turbo"),
          messages: convertToModelMessages(messages),
          tools: {
            ...allTools,
            createCodeArtifact: createCodeArtifact({ dataStream: writer }),
            createImageArtifact: createImageArtifact({ dataStream: writer }),
            createVideoArtifact: createVideoArtifact({ dataStream: writer }),
          },
          system: systemPrompt,
          stopWhen: stepCountIs(7),
          toolChoice: "auto",
        });

        // Merge the streamText result into the UI message stream
        writer.merge(result.toUIMessageStream());
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finalMessages, responseMessage }) => {
        // Clean up MCP connections
        await cleanupMCPConnections(mcpManager, connectedServerIds);

        // Save the assistant's response message
        await orpc.authed.chat.createMessage({
          chatId: chatId!,
          id: responseMessage.id,
          role: responseMessage.role,
          parts: responseMessage.parts,
          attachments: [],
        });
      },
      onError: (error) => {
        console.error("✗ Stream error:", error);

        // Clean up MCP connections on error
        cleanupMCPConnections(mcpManager, connectedServerIds).catch(
          console.error
        );

        return "Oops, an error occurred!";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    console.error("✗ Error in chat API:", error);

    // Ensure MCP connections are cleaned up on error
    await cleanupMCPConnections(mcpManager, connectedServerIds);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Clean up MCP connections for specified server IDs
 */
async function cleanupMCPConnections(
  mcpManager: ReturnType<typeof getMCPManager>,
  serverIds: string[]
): Promise<void> {
  if (serverIds.length === 0) return;

  console.log(`🧹 Cleaning up ${serverIds.length} MCP connections...`);

  const cleanupResults = await Promise.allSettled(
    serverIds.map((serverId) => mcpManager.disconnect(serverId))
  );

  const failedCleanups = cleanupResults.filter(
    (result) => result.status === "rejected"
  );

  if (failedCleanups.length > 0) {
    console.warn(
      `⚠ Failed to clean up ${failedCleanups.length} MCP connections`
    );
  } else {
    console.log("✓ All MCP connections cleaned up successfully");
  }
}

/**
 * RAG tool for searching indexed documents
 */
const ragTool = ({ projectId }: { projectId: string }) => {
  return tool({
    description:
      "Search through indexed documents, knowledge base, user preferences, and project data. Use this whenever the user asks about stored information, settings, documentation, or project-specific content.",
    inputSchema: z.object({
      query: z.string().describe("The search query for documents"),
      topK: z.number().default(5).describe("Number of results to return"),
    }),
    execute: async ({ query, topK }) => {
      try {
        console.log("✅🔎✅🔎✅🔎✅🔎✅🔎✅🔎");
        console.log(`🔎 Searching for "${query}"...`);
        const res = await orpc.authed.rag.searchDocuments({
          query,
          topK,
          projectId,
        });

        if (!res?.success) {
          console.warn("⚠ RAG search failed:", res);
          return {
            answer: `No results found for "${query}". The search was unsuccessful.`,
          };
        }

        if (!res.documents || res.documents.length === 0) {
          console.log(`ℹ No documents found for query: "${query}"`);
          return {
            answer: `No documents found matching "${query}" in the knowledge base.`,
          };
        }

        console.log(`✓ Found ${res.documents.length} documents for "${query}"`);

        return {
          answer: res.documents.map((d) => d.content).join("\n\n"),
        };
      } catch (error) {
        console.error("✗ RAG search error:", error);
        return {
          answer: `Search error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

DO NOT GENERATE THE DOCUMENT CONTENT YOURSELF after calling \`createCodeArtifact\`. The tool will take care of that. Just call the tool with the correct parameters. You must not repeat the document's content in your reply.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createCodeArtifact\` and \`updateDocument\`.

**Use \`createCodeArtifact\` only when:**
- The content is substantial (enough description)
- It's content the user likely wants to save or reuse (e.g. reports, research, papers, books)
- The user explicitly asks to create a document

** use \`createImageArtifact\` only when:**
- The user explicitly asks to create an image

** use \`createVideoArtifact\` only when:**
- The user explicitly asks to create a video


**Avoid using \`createCodeArtifact\` when:**
- The user just wants information or explanations
- You’re answering a short question
- The user asked to keep everything in the chat
- When using createCodeArtifact dont recreate the code in other text

**Use \`updateDocument\`:**
- For editing existing documents
- After a user gives feedback or asks for specific changes
- Prefer full rewrites for major changes

**DO NOT use \`updateDocument\` immediately after a document is created.** Wait for user input before doing so.
`;

function getUserDescriptionFromMessages(messages: UIMessage[]): string {
  let message = messages?.at(-1);
  if (message?.role !== "user") {
    return "";
  }
  console.log(JSON.stringify(message?.parts));
  for (const part of message.parts) {
    if (part.type === "text") {
      return part.text;
    }
  }

  return "";
}
