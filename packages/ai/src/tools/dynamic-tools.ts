import { dynamicTool, type Tool } from "ai";
import { z } from "zod";
import vm from "vm";

// DB Tool type definition
type DBTool = {
  id: string;
  name: string;
  description: string;
  code: string;
};

type DynamicTool = {
  name: string;
  tool: Tool;
};

/**
 * Sanitizes tool name to match OpenAI's pattern: ^[a-zA-Z0-9_-]+$
 */
function sanitizeToolName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/_{2,}/g, "_")
    .replace(/^[^a-zA-Z]+/, "")
    .slice(0, 64);
}

/**
 * Extract parameters from function signature
 */
function extractParameters(code: string): string[] {
  // Try destructured parameters first: function name({ param1, param2 })
  const destructuredMatch = code.match(
    /function\s+\w+\s*\(\s*\{\s*([^}]+)\s*\}/
  );

  if (destructuredMatch) {
    return destructuredMatch[1]
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  // Try simple parameters: function name(param1: type, param2: type)
  const simpleMatch = code.match(/function\s+\w+\s*\(([^)]+)\)/);

  if (simpleMatch) {
    return simpleMatch[1]
      .split(",")
      .map((p) => {
        const paramName = p.trim().split(":")[0].trim();
        return paramName;
      })
      .filter((p) => p.length > 0);
  }

  return [];
}

async function executeCode(code: string, input: any) {
  try {
    // Strip TypeScript type annotations
    const strippedCode = code
      .replace(/:\s*Promise<[^>]+>/g, "")
      .replace(/:\s*\{[^}]+\}/g, "")
      .replace(/:\s*string/g, "")
      .replace(/:\s*number/g, "")
      .replace(/:\s*boolean/g, "")
      .replace(/:\s*any/g, "");

    // Extract function name
    const functionNameMatch = code.match(/function\s+(\w+)/);
    if (!functionNameMatch) {
      throw new Error("Could not extract function name from code");
    }
    const functionName = functionNameMatch[1];

    // Create sandbox context with necessary globals
    const sandbox = {
      fetch: fetch,
      console: console,
      Headers: Headers,
      Request: Request,
      Response: Response,
      URL: URL,
      URLSearchParams: URLSearchParams,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      Promise: Promise,
      Error: Error,
      JSON: JSON,
      Math: Math,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      // Add the input
      __input: input,
      // Variable to store result
      __result: null,
    };

    // Create the script
    const script = new vm.Script(`
      (async () => {
        ${strippedCode}
        __result = await ${functionName}(__input);
      })();
    `);

    // Create context
    const context = vm.createContext(sandbox);

    // Run the script
    await script.runInContext(context);

    return sandbox.__result;
  } catch (error) {
    throw new Error(
      `Code execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Builds dynamic AI SDK tools from database tool definitions
 */
export function buildDynamicTools(dbTools: DBTool[]): DynamicTool[] {
  const usedNames = new Set<string>();

  return dbTools.map((dbTool) => {
    let sanitizedName = sanitizeToolName(dbTool.name);

    let finalName = sanitizedName;
    let counter = 1;
    while (usedNames.has(finalName)) {
      finalName = `${sanitizedName}_${counter}`;
      counter++;
    }
    usedNames.add(finalName);

    if (finalName !== dbTool.name) {
      console.warn(`Tool name sanitized: "${dbTool.name}" -> "${finalName}"`);
    }

    const params = extractParameters(dbTool.code);

    let inputSchema = z.object({});

    if (params.length > 0) {
      const schemaObj: Record<string, any> = {};
      params.forEach((param) => {
        schemaObj[param] = z.string().describe(`The ${param} parameter`);
      });
      inputSchema = z.object(schemaObj);
    } else {
      console.warn(
        `⚠ Could not infer parameters for ${finalName}, using empty schema`
      );
    }

    return {
      name: finalName,
      tool: dynamicTool({
        description: dbTool.description || `Execute ${dbTool.name}`,
        inputSchema: inputSchema,
        execute: async (input: any) => {
          try {
            const paramCount = params.length;
            let actualInput = input;

            if (paramCount === 1) {
              actualInput = input[params[0]];
            }

            const result = await executeCode(dbTool.code, actualInput);
            return result;
          } catch (error) {
            console.error(`❌ Error in ${finalName}:`, error);
            return {
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      }),
    };
  });
}
