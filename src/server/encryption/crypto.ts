import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getMasterKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error("ENCRYPTION_KEY environment variable is not defined");
  }
  const key = Buffer.from(hexKey, "hex");
  if (key.length !== 32) {
    // If not 32 bytes hex, derive using sha256
    return crypto.createHash("sha256").update(hexKey).digest();
  }
  return key;
}

import { EncryptedData } from "@/typings";
export type { EncryptedData };

/**
 * Encrypts a sensitive string (e.g. LLM API Key) using AES-256-GCM.
 */
export function encryptApiKey(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag().toString("hex");
  
  return {
    encryptedKey: encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

/**
 * Decrypts an encrypted key using AES-256-GCM with authentication tag validation.
 */
export function decryptApiKey(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getMasterKey(),
    Buffer.from(encryptedData.iv, "hex")
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));
  
  let decrypted = decipher.update(encryptedData.encryptedKey, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Returns a masked representation of an API key for safe UI display (e.g., ••••••••••••1234).
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 4) return "••••••••";
  const lastFour = apiKey.slice(-4);
  return "•".repeat(Math.min(16, apiKey.length - 4)) + lastFour;
}
