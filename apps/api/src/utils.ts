export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return "";
  return Buffer.from(apiKey).toString("base64");
}

export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return "";
  return Buffer.from(encryptedKey, "base64").toString("utf-8");
}
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return `${apiKey.slice(0, 2)}...${apiKey.slice(-2)}`;
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}
