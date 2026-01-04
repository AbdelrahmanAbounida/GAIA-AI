import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { appRouter } from "@gaia/api";
import { getServerSession } from "@/lib/auth/actions";

const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Request-Method", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
};

async function handleRequest(request: Request) {
  // Get session data
  const session = await getServerSession();
  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: {
      session,
    },
  });

  const res = response ?? new Response("Not found", { status: 404 });
  setCorsHeaders(res);
  return res;
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
