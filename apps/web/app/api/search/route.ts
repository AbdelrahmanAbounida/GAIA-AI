import { orpcServer as orpc } from "@/lib/orpc/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query, projectId } = await req.json();
  try {
    const res = await orpc.authed.rag.searchDocuments({
      query,
      topK: 5,
      projectId,
    });
    return NextResponse.json(
      {
        documents: res?.documents || [],
        success: res?.success,
        message: res?.message,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error({ e });
    return NextResponse.json(
      {
        documents: [],
      },
      { status: 200 }
    );
  }
}
