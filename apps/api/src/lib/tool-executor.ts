import { db, eq, tool, credential, sql } from "@gaia/db";
import { createOpenAICompatible } from "@gaia/ai";
import { VM } from "vm2";

interface ToolExecutionContext {
  userId: string;
  toolId: string;
  params: Record<string, any>;
  credentials?: {
    aiCredentials?: any[];
    vectorstoreCredentials?: any[];
    customCredentials?: Record<string, any>;
  };
}

interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export class ToolExecutor {
  /**
   * Execute a tool with proper credential injection
   */
  static async execute(
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Get the tool
      const [toolData] = await db
        .select()
        .from(tool)
        .where(eq(tool.id, context.toolId));

      if (!toolData) {
        throw new Error("Tool not found");
      }

      if (!toolData.enabled) {
        throw new Error("Tool is disabled");
      }

      // Get user credentials
      const userCredentials = await this.getUserCredentials(context.userId);

      // Prepare execution environment
      const executionEnv = await this.prepareExecutionEnvironment(
        toolData,
        userCredentials,
        context.params
      );

      // Execute the tool
      const result = await this.executeCode(
        toolData.code!,
        toolData.language || "javascript",
        executionEnv
      );

      // Update usage statistics
      await this.updateToolStats(context.toolId);

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get user credentials securely
   */
  private static async getUserCredentials(userId: string) {
    const credentials = await db
      .select()
      .from(credential)
      .where(eq(credential.userId, userId));

    // Group credentials by type
    const grouped = {
      aiCredentials: credentials
        .filter((c) => c.credentialType === "ai_model")
        .map((c) => ({
          id: c.id,
          provider: c.provider,
          name: c.name,
          baseUrl: c.baseUrl,
          // Don't expose raw API key
          hasApiKey: !!c.apiKey,
        })),
      vectorstoreCredentials: credentials
        .filter((c) => c.credentialType === "vectorstore")
        .map((c) => ({
          id: c.id,
          provider: c.provider,
          name: c.name,
          hasApiKey: !!c.apiKey,
        })),
      embeddingCredentials: credentials
        .filter((c) => c.credentialType === "embedding")
        .map((c) => ({
          id: c.id,
          provider: c.provider,
          name: c.name,
          hasApiKey: !!c.apiKey,
        })),
    };

    return { credentials, grouped };
  }

  /**
   * Prepare execution environment with safe API access
   */
  private static async prepareExecutionEnvironment(
    toolData: any,
    userCredentials: any,
    params: Record<string, any>
  ) {
    const { credentials, grouped } = userCredentials;

    // Create credential helpers that tools can use
    const credentialHelpers = {
      /**
       * Get AI model client
       */
      getAiClient: (credentialId?: string) => {
        let cred;

        if (credentialId) {
          cred = credentials.find(
            (c: any) => c.id === credentialId && c.credentialType === "ai_model"
          );
        } else {
          // Use first available AI credential
          cred = credentials.find((c: any) => c.credentialType === "ai_model");
        }

        if (!cred) {
          throw new Error("No AI credentials found");
        }

        return createOpenAICompatible({
          name: cred.provider || "openai",
          apiKey: cred.apiKey,
          baseURL: cred.baseUrl || undefined,
        });
      },

      /**
       * Get API key for external service
       */
      getApiKey: (credentialId: string) => {
        const cred = credentials.find((c: any) => c.id === credentialId);

        if (!cred) {
          throw new Error("Credential not found");
        }

        return cred.apiKey;
      },

      /**
       * List available credentials
       */
      listCredentials: () => grouped,
    };

    return {
      params,
      credentials: credentialHelpers,
      // Expose safe utilities
      console: {
        log: (...args: any[]) => console.log("[Tool]", ...args),
        error: (...args: any[]) => console.error("[Tool]", ...args),
        warn: (...args: any[]) => console.warn("[Tool]", ...args),
      },
      fetch: fetch, // For external API calls
    };
  }

  /**
   * Execute code in sandboxed environment
   */
  private static async executeCode(
    code: string,
    language: string,
    environment: any
  ): Promise<any> {
    if (language === "python") {
      return this.executePythonCode(code, environment);
    }

    return this.executeJavaScriptCode(code, environment);
  }

  /**
   * Execute JavaScript/TypeScript code
   */
  private static async executeJavaScriptCode(
    code: string,
    environment: any
  ): Promise<any> {
    try {
      // Create a sandboxed VM
      const vm = new VM({
        timeout: 30000, // 30 second timeout
        sandbox: environment,
      });

      // Wrap code to ensure it exports execute function
      const wrappedCode = `
        ${code}

        // Return the execute function
        if (typeof execute === 'function') {
          execute;
        } else {
          throw new Error('No execute function found');
        }
      `;

      const executeFunc = vm.run(wrappedCode);

      if (typeof executeFunc !== "function") {
        throw new Error("Execute export is not a function");
      }

      // Run the execute function
      const result = await executeFunc(environment.params);
      return result;
    } catch (error: any) {
      throw new Error(`Execution error: ${error.message}`);
    }
  }

  /**
   * Execute Python code (requires Python runtime)
   */
  private static async executePythonCode(
    code: string,
    environment: any
  ): Promise<any> {
    // This would require a Python runtime integration
    // Options:
    // 1. Use python-shell npm package
    // 2. Use child_process to spawn Python
    // 3. Use a Python microservice

    throw new Error("Python execution not yet implemented");
  }

  /**
   * Update tool usage statistics
   */
  private static async updateToolStats(toolId: string) {
    await db
      .update(tool)
      .set({
        totalCalls: sql`total_calls + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(tool.id, toolId));
  }
}

/**
 * API Route for executing tools
 */
export const executeToolRoute = {
  method: "POST",
  path: "/tools/:id/execute",
  handler: async (req: any, res: any) => {
    const { id } = req.params;
    const { params, credentialOverrides } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await ToolExecutor.execute({
      userId,
      toolId: id,
      params,
      credentials: credentialOverrides,
    });

    return res.json(result);
  },
};

/**
 * Example tool code that uses credentials
 */
export const exampleToolWithAiSdk = `
import { generateText } from "ai";

interface Params {
  prompt: string;
  credentialId?: string; // Optional: specific credential to use
}

export async function execute(params: Params): Promise<any> {
  try {
    // Get AI client from provided credentials
    const aiClient = credentials.getAiClient(params.credentialId);

    // Use the AI SDK
    const result = await generateText({
      model: aiClient("gpt-4"),
      prompt: params.prompt,
    });

    return {
      success: true,
      data: {
        text: result.text,
        usage: result.usage,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
`;

/**
 * Example tool with external API
 */
export const exampleToolWithExternalApi = `
interface Params {
  query: string;
  apiCredentialId: string; // Required credential ID for the external API
}

export async function execute(params: Params): Promise<any> {
  try {
    // Get API key from credentials
    const apiKey = credentials.getApiKey(params.apiCredentialId);

    // Make external API call
    const response = await fetch('https://api.example.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`,
      },
      body: JSON.stringify({ query: params.query }),
    });

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
`;

/**
 * Example tool that combines both AI SDK and external API
 */
export const exampleHybridTool = `
import { generateText } from "ai";

interface Params {
  userQuery: string;
  aiCredentialId?: string;
  externalApiCredentialId: string;
}

export async function execute(params: Params): Promise<any> {
  try {
    // Step 1: Get data from external API
    const apiKey = credentials.getApiKey(params.externalApiCredentialId);

    const externalData = await fetch('https://api.example.com/data', {
      headers: { 'Authorization': \`Bearer \${apiKey}\` },
    }).then(r => r.json());

    // Step 2: Use AI to process the data
    const aiClient = credentials.getAiClient(params.aiCredentialId);

    const analysis = await generateText({
      model: aiClient("gpt-4"),
      prompt: \`Analyze this data: \${JSON.stringify(externalData)}

User query: \${params.userQuery}\`,
    });

    return {
      success: true,
      data: {
        rawData: externalData,
        analysis: analysis.text,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
`;
