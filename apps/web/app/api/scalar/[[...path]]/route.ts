import { apiRouterV1 } from "@gaia/api";
import { OpenAPIGenerator, ZodToJsonSchemaConverter } from "@gaia/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const openAPIGenerator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });
  const pathname = request.nextUrl.pathname;

  if (pathname === "/api/scalar/spec.json") {
    const spec = await openAPIGenerator.generate(apiRouterV1, {
      info: {
        title: "GAIA API",
        version: "1.0.0",
        description:
          "GAIA API for managing projects, prompts, and AI interactions",
      },
      servers: [{ url: "/api/v1" }],
      security: [{ gaiaApiKey: [] }],
      components: {
        securitySchemes: {
          gaiaApiKey: {
            type: "apiKey",
            in: "header",
            name: "gaia-api-key",
            description: "API key for Gaia authentication",
          },
        },
      },
    });

    return NextResponse.json(spec);
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <title>GAIA API Documentation</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/api-logo.png" />
      </head>
      <body>
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script>
          Scalar.createApiReference('#app', {
            url: '/api/scalar/spec.json',
            authentication: {
              preferredSecurityScheme: 'gaiaApiKey',
              apiKey: {
                token: 'your-default-api-key',
              },
            },
            layout: 'modern',
            theme: 'default',
          })
        </script>
      </body>
    </html>
  `;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
