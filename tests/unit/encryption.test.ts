import { describe, it, expect, beforeEach } from "vitest";
import { encryptApiKey, decryptApiKey, maskApiKey } from "@/server/encryption/crypto";

describe("AES-256-GCM Encryption Service", () => {
  beforeEach(() => {
    // Set a known 32-byte (64 hex characters) key for testing
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  it("successfully encrypts and decrypts an API key", () => {
    const originalKey = "sk-ant-api03-test-secret-key-12345";
    const encrypted = encryptApiKey(originalKey);

    expect(encrypted).toHaveProperty("encryptedKey");
    expect(encrypted).toHaveProperty("iv");
    expect(encrypted).toHaveProperty("tag");
    expect(encrypted.encryptedKey).not.toBe(originalKey);

    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(originalKey);
  });

  it("handles empty or arbitrary strings correctly", () => {
    const testStrings = [
      "AIzaSyDemoKeyForGemini-ABC123456",
      "sk-proj-openai-sample-token-XYZ",
      "short",
      "Special characters: !@#$%^&*()_+-=[]{}|;:',.<>?/",
    ];

    for (const str of testStrings) {
      const encrypted = encryptApiKey(str);
      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(str);
    }
  });

  it("fails decryption if the ciphertext or authentication tag is tampered with", () => {
    const encrypted = encryptApiKey("my-super-secret-key");
    
    // Tamper with tag
    const tamperedTag = {
      ...encrypted,
      tag: encrypted.tag.replace(/^./, (c) => (c === "a" ? "b" : "a")),
    };
    expect(() => decryptApiKey(tamperedTag)).toThrow();

    // Tamper with encrypted ciphertext
    const tamperedCipher = {
      ...encrypted,
      encryptedKey: encrypted.encryptedKey.replace(/^./, (c) => (c === "a" ? "b" : "a")),
    };
    expect(() => decryptApiKey(tamperedCipher)).toThrow();
  });

  it("derives a 32-byte key via sha256 if ENCRYPTION_KEY is not 64 hex characters", () => {
    process.env.ENCRYPTION_KEY = "short-passphrase-not-64-hex";
    const key = "sk-test-passphrase-key";
    const enc = encryptApiKey(key);
    const dec = decryptApiKey(enc);
    expect(dec).toBe(key);
  });

  it("masks API keys securely showing only the last 4 characters", () => {
    expect(maskApiKey("sk-proj-1234567890abcdef")).toBe("••••••••••••••••cdef");
    expect(maskApiKey("AIzaSyB1234")).toBe("•••••••1234");
    expect(maskApiKey("abc")).toBe("••••••••");
    expect(maskApiKey("")).toBe("••••••••");
  });
});
