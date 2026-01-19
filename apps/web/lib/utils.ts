import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UIMessagePart } from "ai";
import { Message as DBMessage } from "@gaia/db";
import { formatISO } from "date-fns";
import { ChatMessage, CustomUIDataTypes, ChatTools } from "@gaia/ai/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sanitizeText(text: string) {
  return text.replace("<has_function_call>", "");
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant" | "system",
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message?.createdAt!),
      attachments: message.attachments as string[],
    },
  }));
}
export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return "***";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

export const validateJSON = (json: string): boolean => {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
};

export function validateURL(value: string): boolean {
  try {
    const url = new URL(value);
    return !!url.protocol && !!url.hostname;
  } catch {
    return false;
  }
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new Error(`${code}: ${cause}`);
  }

  return response.json();
};

export function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "gaia_";
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export const isVercel = () => {
  return (
    true ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV ||
    !!process.env.NEXT_PUBLIC_VERCEL
  );
};
