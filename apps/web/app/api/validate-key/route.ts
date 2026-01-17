import { validateApiKey } from "@gaia/ai/models";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { apiKey, baseUrl, ...props } = await req.json();

  const isValid = await validateApiKey({
    apiKey: apiKey,
    baseUrl: baseUrl,
    ...props,
  });

  return NextResponse.json({
    isValid,
    message: isValid ? "Valid API key" : "Invalid API key or headers",
  });
}
