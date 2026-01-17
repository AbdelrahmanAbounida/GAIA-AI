import { onError } from "@orpc/server";
import { CORSPlugin } from "@orpc/server/plugins";
import {
  apiRouterV1,
  OpenAPIHandlerNode,
  ZodSmartCoercionPlugin,
} from "@gaia/api";
import { NextResponse } from "next/server";

const handler = new OpenAPIHandlerNode(apiRouterV1, {
  plugins: [new CORSPlugin(), new ZodSmartCoercionPlugin()],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
async function handleRequest(request: Request) {
  const { matched, response } = await handler.handle(request, {
    prefix: "/api/v1",
    context: {
      headers: Object.fromEntries(request.headers.entries()),
    },
  });

  // Handle case where no route matched
  if (!matched) {
    return new NextResponse(
      JSON.stringify({
        error: "Route not found",
        path: new URL(request.url).pathname,
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return response;
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
