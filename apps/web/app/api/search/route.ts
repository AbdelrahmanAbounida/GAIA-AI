import { orpc } from "@/lib/orpc/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query, projectId } = await req.json();
  console.log({ query, projectId });
  try {
    const res = await orpc.authed.rag.searchDocuments({
      query,
      topK: 5,
      projectId,
    });
    console.log({ res });
    return NextResponse.json(
      {
        documents: res?.documents || [],
        success: res?.success,
        message: res?.message,
      },
      { status: 200 }
    );
  } catch (e) {
    console.log({ e });
    return NextResponse.json(
      {
        documents: [],
      },
      { status: 200 }
    );
  }
}
