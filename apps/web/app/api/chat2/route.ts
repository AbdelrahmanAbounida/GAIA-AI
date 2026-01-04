import { ChatMessage } from "@gaia/ai/types";
import { Experimental_Agent as Agent, tool, Output, stepCountIs } from "ai";
import { z } from "zod";

// Web Search Tool
const webSearchTool = tool({
  description: "Search the web for current information",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    // Simulate web search - replace with actual API
    const results = [
      {
        title: "Result 1",
        url: "https://example.com/1",
        snippet: "Information about " + query,
      },
      {
        title: "Result 2",
        url: "https://example.com/2",
        snippet: "More details on " + query,
      },
    ];
    return { results, query };
  },
});

// Code Execution Tool
const executeCodeTool = tool({
  description: "Execute Python code safely in a sandbox",
  inputSchema: z.object({
    code: z.string().describe("Python code to execute"),
    language: z.enum(["python", "javascript"]).default("python"),
  }),
  execute: async ({ code, language }) => {
    // Simulate code execution - replace with actual sandbox
    return {
      output: `Executed ${language} code successfully`,
      stdout: "Hello from " + language,
      stderr: "",
      exitCode: 0,
    };
  },
});

// RAG Document Search Tool
const ragSearchTool = tool({
  description: "Search through indexed documents and knowledge base",
  inputSchema: z.object({
    query: z.string().describe("The search query for documents"),
    topK: z.number().default(5).describe("Number of results to return"),
  }),
  execute: async ({ query, topK }) => {
    // Simulate RAG search - replace with actual vector database query
    // This would typically involve:
    // 1. Convert query to embeddings
    // 2. Search vector database
    // 3. Retrieve relevant document chunks

    const documents = [
      {
        id: "doc1",
        content: "Relevant information about " + query,
        metadata: { source: "documentation.pdf", page: 5 },
        score: 0.95,
      },
      {
        id: "doc2",
        content: "Additional context for " + query,
        metadata: { source: "manual.txt", section: "Chapter 3" },
        score: 0.87,
      },
    ];

    return { documents: documents.slice(0, topK), query };
  },
});

// File Analysis Tool
const analyzeFileTool = tool({
  description: "Analyze uploaded files (PDFs, images, documents)",
  inputSchema: z.object({
    fileUrl: z.string().describe("URL or path to the file"),
    analysisType: z.enum(["extract_text", "summarize", "analyze_structure"]),
  }),
  execute: async ({ fileUrl, analysisType }) => {
    // Simulate file analysis - replace with actual file processing
    return {
      fileName: fileUrl.split("/").pop(),
      analysis: `Performed ${analysisType} on file`,
      content: "Extracted content from the file...",
    };
  },
});

// Database Query Tool
const queryDatabaseTool = tool({
  description: "Query structured data from database",
  inputSchema: z.object({
    query: z.string().describe("Natural language query"),
    table: z.string().optional().describe("Specific table to query"),
  }),
  execute: async ({ query, table }) => {
    // Simulate database query - replace with actual DB connection
    return {
      results: [
        { id: 1, data: "Sample result 1" },
        { id: 2, data: "Sample result 2" },
      ],
      rowCount: 2,
      executionTime: "45ms",
    };
  },
});

// Task Creation Tool
const createTaskTool = tool({
  description: "Create a new task or todo item",
  inputSchema: z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  }),
  execute: async ({ title, description, priority }) => {
    const taskId = `task-${Date.now()}`;
    return {
      id: taskId,
      title,
      description,
      priority,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  },
});

// Weather Tool (example from docs)
const weatherTool = tool({
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string(),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
  }),
  execute: async ({ location, units }) => {
    // Simulate weather API
    const temp =
      units === "celsius"
        ? Math.floor(Math.random() * 35) + 5
        : Math.floor(Math.random() * 63) + 41;

    return {
      location,
      temperature: `${temp}°${units === "celsius" ? "C" : "F"}`,
      conditions: "Sunny",
      humidity: "65%",
      windSpeed: `15 ${units === "celsius" ? "km/h" : "mph"}`,
      lastUpdated: new Date().toISOString(),
    };
  },
});

// ============= STRUCTURED OUTPUT SCHEMAS =============

const analysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const codeReviewSchema = z.object({
  issues: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high"]),
      description: z.string(),
      line: z.number().optional(),
    })
  ),
  suggestions: z.array(z.string()),
  overallScore: z.number().min(1).max(10),
});

// ============= AGENT CONFIGURATIONS =============

// General Purpose Agent
const generalAgent = new Agent({
  model: "anthropic/claude-sonnet-4-20250514",
  system: `You are a helpful AI assistant with access to various tools.
  
  Guidelines:
  - Use tools when needed to provide accurate information
  - Search the web for current information
  - Use RAG search for internal documents
  - Create tasks when users need help organizing work
  - Always cite your sources when using tools
  - Be concise but thorough`,
  tools: {
    webSearch: webSearchTool,
    ragSearch: ragSearchTool,
    createTask: createTaskTool,
    weather: weatherTool,
  },
  stopWhen: stepCountIs(15),
});

// Research Agent (with emphasis on RAG and web search)
const researchAgent = new Agent({
  model: "anthropic/claude-sonnet-4-20250514",
  system: `You are a research assistant specialized in finding and synthesizing information.
  
  Research workflow:
  1. Search internal knowledge base first (RAG)
  2. Supplement with web search if needed
  3. Cross-reference multiple sources
  4. Provide detailed citations
  5. Present information clearly with sources`,
  tools: {
    ragSearch: ragSearchTool,
    webSearch: webSearchTool,
    analyzeFile: analyzeFileTool,
  },
  stopWhen: stepCountIs(20),
});

// Code Assistant Agent
const codeAgent = new Agent({
  model: "anthropic/claude-sonnet-4-20250514",
  system: `You are an expert software engineer who can execute and analyze code.
  
  Capabilities:
  - Write and execute code in Python and JavaScript
  - Review code for issues and improvements
  - Explain complex code concepts
  - Debug and troubleshoot problems
  - Follow best practices and coding standards`,
  tools: {
    executeCode: executeCodeTool,
    ragSearch: ragSearchTool,
  },
  experimental_output: Output.object({
    schema: codeReviewSchema,
  }),
  stopWhen: stepCountIs(10),
});

// Data Analysis Agent
const dataAgent = new Agent({
  model: "anthropic/claude-sonnet-4-20250514",
  system: `You are a data analyst who can query databases and analyze information.
  
  Analysis approach:
  - Query databases using natural language
  - Analyze trends and patterns
  - Provide statistical insights
  - Create clear summaries of findings
  - Suggest actionable recommendations`,
  tools: {
    queryDatabase: queryDatabaseTool,
    executeCode: executeCodeTool,
  },
  experimental_output: Output.object({
    schema: analysisSchema,
  }),
  stopWhen: stepCountIs(12),
});

// ============= AGENT ROUTER =============

async function routeToAgent(messages: ChatMessage[], model?: string) {
  console.log(JSON.stringify(messages[messages.length - 1]));
  // const lastMessage = messages[messages.length - 1].content.toLowerCase();
  let lastMessageContent = "";

  messages[messages.length - 1].parts?.map((part) => {
    if (part.type === "text") {
      lastMessageContent = part.text as string;
    }
  });

  // Route based on message content
  if (
    lastMessageContent.includes("research") ||
    lastMessageContent.includes("find information")
  ) {
    return researchAgent;
  }

  if (
    lastMessageContent.includes("code") ||
    lastMessageContent.includes("program") ||
    lastMessageContent.includes("debug")
  ) {
    return codeAgent;
  }

  if (
    lastMessageContent.includes("data") ||
    lastMessageContent.includes("analyze") ||
    lastMessageContent.includes("query")
  ) {
    return dataAgent;
  }

  // Default to general agent
  return generalAgent;
}

// ============= API ROUTE HANDLER =============

export async function POST(request: Request) {
  try {
    const { messages, model } = await request.json();

    // Route to appropriate agent
    const agent = await routeToAgent(messages, model);

    // Generate response
    const result = await agent.generate({
      messages,
    });

    // Process result and add AI element metadata
    const response = {
      text: result.text,

      // Chain of Thought (if available)
      chainOfThought:
        result.steps?.length > 0
          ? {
              steps: result.steps.map((step: any) => ({
                label: step.text || step.toolName,
                status: "complete",
                icon: step.toolName === "webSearch" ? "search" : undefined,
                searchResults:
                  step.toolName === "webSearch"
                    ? step.result?.results?.map((r: any) => r.title)
                    : undefined,
              })),
            }
          : undefined,

      // Reasoning (for complex tasks)
      reasoning: result.reasoning || undefined,

      // Sources (from tool calls)
      sources: result.toolCalls
        ?.filter(
          (tc: any) =>
            tc.toolName === "webSearch" || tc.toolName === "ragSearch"
        )
        .flatMap(
          (tc: any) =>
            tc.result?.results?.map((r: any) => ({
              title: r.title || r.source,
              url: r.url || "#",
            })) || []
        ),

      // Tasks (from chain of thought or tool results)
      tasks: result.toolCalls
        ?.filter(
          (tc: any) =>
            tc.toolName === "executeCode" || tc.toolName === "analyzeFile"
        )
        .map((tc: any) => ({
          title: `Executed: ${tc.toolName}`,
          items: [
            { type: "text", text: "Processing request..." },
            { type: "text", text: "Completed successfully" },
          ],
          status: "completed",
        })),

      // Tools (all tool calls)
      tools: result.toolCalls?.map((tc: any) => ({
        name: tc.toolName,
        input: tc.args,
        output:
          typeof tc.result === "string"
            ? tc.result
            : JSON.stringify(tc.result, null, 2),
        state: "complete",
      })),

      // Structured Output (if using output schema)
      structuredOutput: result.experimental_output || undefined,

      // Todos (if createTask was called)
      todos: result.toolCalls
        ?.filter((tc: any) => tc.toolName === "createTask")
        .map((tc: any) => ({
          id: tc.result.id,
          title: tc.result.title,
          description: tc.result.description,
          status: tc.result.status,
        })),
    };

    return Response.json(response);
  } catch (error) {
    console.error("Chat API Error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// ============= STREAMING VERSION (OPTIONAL) =============
export async function STREAM(request: Request) {
  try {
    const { messages, model } = await request.json();
    const agent = await routeToAgent(messages, model);

    // Use stream() for streaming responses
    const stream = agent.stream({ messages });

    // Transform stream to include AI elements
    const transformedStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream.textStream) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream API Error:", error);
    return Response.json(
      { error: "Failed to stream response" },
      { status: 500 }
    );
  }
}
