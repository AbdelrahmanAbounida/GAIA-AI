import { validateApiKey } from "@gaia/ai/models";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, apiKey } = body;

    console.log({ url, apiKey });

    // Validate input
    if (!url || !apiKey) {
      return NextResponse.json(
        { success: false, message: "URL and API key are required" },
        { status: 400 }
      );
    }

    // Ensure URL is properly formatted
    const apiUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    const modelsEndpoint = `${apiUrl}/models`;

    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(modelsEndpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            success: false,
            message: `API returned ${response.status}: ${
              errorData.error?.message || JSON.stringify(errorData)
            }`,
            statusCode: response.status,
          },
          { status: 200 }
        );
      } else {
        if (url?.includes("vercel")) {
          // validate the key
          const isValid = await validateApiKey({
            apiKey: apiKey,
            baseUrl: url,
          });

          if (!isValid) {
            return NextResponse.json(
              {
                success: false,
                message: `Invalid API key or headers`,
              },
              { status: 200 }
            );
          }
        }
      }

      const data = await response.json();

      return NextResponse.json({
        success: true,
        message: "API credentials validated successfully",
        data: data,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          return NextResponse.json(
            {
              success: false,
              message:
                "Request timeout: The API endpoint took too long to respond",
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            message: `Network error: ${fetchError.message}`,
          },
          { status: 200 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
