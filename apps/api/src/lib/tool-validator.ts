import * as ts from "typescript";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  hasExecuteFunction: boolean;
  dependencies: string[];
  usesAiSdk: boolean;
  usesExternalApi: boolean;
}

export class ToolCodeValidator {
  /**
   * Validate TypeScript/JavaScript code
   */
  static validate(
    code: string,
    language: "javascript" | "python"
  ): ValidationResult {
    if (language === "python") {
      return this.validatePython(code);
    }
    return this.validateTypeScript(code);
  }

  /**
   * Validate TypeScript code
   */
  private static validateTypeScript(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let hasExecuteFunction = false;
    const dependencies = new Set<string>();
    let usesAiSdk = false;
    let usesExternalApi = false;

    try {
      // Check for syntax errors
      const sourceFile = ts.createSourceFile(
        "temp.ts",
        code,
        ts.ScriptTarget.Latest,
        true
      );

      // Get diagnostics
      const diagnostics = ts.getPreEmitDiagnostics(
        ts.createProgram({
          rootNames: ["temp.ts"],
          options: {},
          host: {
            fileExists: (fileName) => fileName === "temp.ts",
            readFile: (fileName) => (fileName === "temp.ts" ? code : undefined),
            getSourceFile: (fileName, languageVersion) =>
              fileName === "temp.ts" ? sourceFile : undefined,
            writeFile: () => {},
            getDefaultLibFileName: () => "lib.d.ts",
            getCurrentDirectory: () => "",
            getCanonicalFileName: (fileName) => fileName,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        })
      );

      diagnostics.forEach((diagnostic) => {
        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          "\n"
        );
        errors.push(`Syntax error: ${message}`);
      });

      // Extract imports and check for execute function
      ts.forEachChild(sourceFile, (node) => {
        // Check imports
        if (ts.isImportDeclaration(node)) {
          const moduleSpecifier = node.moduleSpecifier;
          if (ts.isStringLiteral(moduleSpecifier)) {
            const importPath = moduleSpecifier.text;

            // Extract package name
            if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
              const pkgName = importPath.startsWith("@")
                ? importPath.split("/").slice(0, 2).join("/")
                : importPath.split("/")[0];
              dependencies.add(pkgName);

              // Check for AI SDK usage
              if (importPath.includes("@ai-sdk") || importPath.includes("ai")) {
                usesAiSdk = true;
              }
            }
          }
        }

        // Check for execute function
        if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
          const name = node.name?.getText(sourceFile);
          if (name === "execute") {
            hasExecuteFunction = true;
          }
        }

        // Check for export of execute
        if (
          ts.isExportAssignment(node) ||
          (ts.isVariableStatement(node) &&
            node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
        ) {
          const text = node.getText(sourceFile);
          if (text.includes("execute")) {
            hasExecuteFunction = true;
          }
        }

        // Check for external API calls
        if (ts.isCallExpression(node)) {
          const expression = node.expression.getText(sourceFile);
          if (
            expression.includes("fetch") ||
            expression.includes("axios") ||
            expression.includes("request")
          ) {
            usesExternalApi = true;
          }
        }
      });

      // Validations
      if (!hasExecuteFunction) {
        errors.push('Missing required "execute" function export');
      }

      // Check for async execute
      const executeMatch = code.match(/export\s+(async\s+)?function\s+execute/);
      if (executeMatch && !executeMatch[1]) {
        warnings.push(
          "Execute function should be async for better error handling"
        );
      }

      // Check for error handling
      if (!code.includes("try") && !code.includes("catch")) {
        warnings.push("Consider adding try-catch blocks for error handling");
      }

      // Check for return statement
      if (hasExecuteFunction && !code.includes("return")) {
        warnings.push("Execute function should return a result object");
      }

      // Check for API key handling if using external APIs
      if (
        usesExternalApi &&
        !code.includes("apiKey") &&
        !code.includes("API_KEY")
      ) {
        warnings.push("External API detected but no API key parameter found");
      }
    } catch (error: any) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      hasExecuteFunction,
      dependencies: Array.from(dependencies),
      usesAiSdk,
      usesExternalApi,
    };
  }

  /**
   * Validate Python code (basic validation)
   */
  private static validatePython(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const dependencies = new Set<string>();
    let hasExecuteFunction = false;
    let usesAiSdk = false;
    let usesExternalApi = false;

    // Check for execute function
    if (code.includes("def execute(") || code.includes("async def execute(")) {
      hasExecuteFunction = true;
    } else {
      errors.push('Missing required "execute" function');
    }

    // Extract imports
    const importRegex = /^(?:from\s+(\S+)\s+import|import\s+(\S+))/gm;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const pkg = match[1] || match[2];
      if (pkg) {
        dependencies.add(pkg.split(".")[0]);
      }
    }

    // Check for external API usage
    if (
      code.includes("requests.") ||
      code.includes("urllib") ||
      code.includes("httpx")
    ) {
      usesExternalApi = true;
    }

    // Check for AI SDK (OpenAI, etc.)
    if (code.includes("openai") || code.includes("anthropic")) {
      usesAiSdk = true;
    }

    // Check for error handling
    if (!code.includes("try:") && !code.includes("except")) {
      warnings.push("Consider adding try-except blocks for error handling");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      hasExecuteFunction,
      dependencies: Array.from(dependencies),
      usesAiSdk,
      usesExternalApi,
    };
  }

  /**
   * Generate a template for a tool
   */
  static generateTemplate(options: {
    name: string;
    description: string;
    usesAiSdk?: boolean;
    usesExternalApi?: boolean;
    language: "javascript" | "python";
  }): string {
    if (options.language === "python") {
      return this.generatePythonTemplate(options);
    }
    return this.generateTypeScriptTemplate(options);
  }

  private static generateTypeScriptTemplate(options: {
    name: string;
    description: string;
    usesAiSdk?: boolean;
    usesExternalApi?: boolean;
  }): string {
    const imports: string[] = [];

    if (options.usesAiSdk) {
      imports.push(
        `import { createOpenAICompatible } from "@ai-sdk/openai-compatible";`
      );
    }

    if (options.usesExternalApi) {
      imports.push(`// Import your HTTP client (e.g., fetch, axios)`);
    }

    return `${imports.join("\n")}
${imports.length > 0 ? "\n" : ""}/**
 * ${options.description}
 */

interface ${toPascalCase(options.name)}Params {
  // Define your input parameters here
  input: string;
  ${options.usesAiSdk ? "credentials?: { apiKey: string; baseURL: string; };" : ""}
  ${options.usesExternalApi ? "apiKey?: string;" : ""}
}

interface ${toPascalCase(options.name)}Result {
  success: boolean;
  data?: any;
  error?: string;
}

export async function execute(
  params: ${toPascalCase(options.name)}Params
): Promise<${toPascalCase(options.name)}Result> {
  try {
    ${
      options.usesAiSdk
        ? `
    // Initialize AI SDK
    const aiGateway = createOpenAICompatible({
      name: "openai",
      apiKey: params.credentials?.apiKey || "",
      baseURL: params.credentials?.baseURL || "",
    });
    
    // Use the AI model
    // const result = await aiGateway.chat(...);
    `
        : ""
    }
    ${
      options.usesExternalApi
        ? `
    // Make external API call
    const response = await fetch('https://api.example.com/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ${options.usesExternalApi ? "'Authorization': `Bearer ${params.apiKey}`," : ""}
      },
      body: JSON.stringify({ input: params.input }),
    });
    
    const data = await response.json();
    `
        : `
    // Implement your tool logic here
    const result = { message: \`Processed: \${params.input}\` };
    `
    }
    
    return {
      success: true,
      data: ${options.usesExternalApi ? "data" : "result"},
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}`;
  }

  private static generatePythonTemplate(options: {
    name: string;
    description: string;
    usesAiSdk?: boolean;
    usesExternalApi?: boolean;
  }): string {
    const imports: string[] = ["from typing import Dict, Any"];

    if (options.usesExternalApi) {
      imports.push("import requests");
    }

    if (options.usesAiSdk) {
      imports.push("import openai");
    }

    return `${imports.join("\n")}

def execute(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    ${options.description}
    
    Args:
        params: Dictionary containing input parameters
        
    Returns:
        Dictionary with success status and result data
    """
    try:
        ${
          options.usesAiSdk
            ? `
        # Initialize AI client
        client = openai.OpenAI(
            api_key=params.get('credentials', {}).get('apiKey'),
            base_url=params.get('credentials', {}).get('baseURL')
        )
        `
            : ""
        }
        ${
          options.usesExternalApi
            ? `
        # Make external API call
        response = requests.post(
            'https://api.example.com/endpoint',
            json={'input': params['input']},
            headers={'Authorization': f"Bearer {params.get('apiKey', '')}"}
        )
        data = response.json()
        `
            : `
        # Implement your tool logic here
        result = {'message': f"Processed: {params['input']}"}
        `
        }
        
        return {
            'success': True,
            'data': ${options.usesExternalApi ? "data" : "result"}
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }`;
  }
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}
