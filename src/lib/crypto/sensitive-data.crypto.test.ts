import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  CacheLookupHmac,
  SensitiveDataConfigurationError,
  SensitiveDataCrypto,
  SensitiveDataDecryptionError,
} from "./sensitive-data.crypto";

const KEY_A = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const KEY_B = "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=";

describe("SensitiveDataCrypto", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  });

  it("round-trips JSON without exposing plaintext", async () => {
    const crypto = new SensitiveDataCrypto(KEY_A);
    const value = { original_sentence: "Sensitive sentence", translation: null };

    const encrypted = await crypto.encryptJson(value, "aad");

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain("Sensitive sentence");
    await expect(crypto.decryptJson(encrypted, "aad")).resolves.toEqual(value);
  });

  it("uses a fresh IV for every encryption", async () => {
    const crypto = new SensitiveDataCrypto(KEY_A);

    const first = await crypto.encryptJson({ value: "same" }, "aad");
    const second = await crypto.encryptJson({ value: "same" }, "aad");

    expect(first).not.toBe(second);
  });

  it("rejects tampering, wrong AAD and wrong keys", async () => {
    const crypto = new SensitiveDataCrypto(KEY_A);
    const encrypted = await crypto.encryptJson({ value: "secret" }, "aad");
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;

    await expect(crypto.decryptJson(tampered, "aad")).rejects.toBeInstanceOf(SensitiveDataDecryptionError);
    await expect(crypto.decryptJson(encrypted, "other-aad")).rejects.toBeInstanceOf(SensitiveDataDecryptionError);
    await expect(new SensitiveDataCrypto(KEY_B).decryptJson(encrypted, "aad")).rejects.toBeInstanceOf(
      SensitiveDataDecryptionError
    );
  });

  it("rejects encryption keys that are not 256 bits", () => {
    expect(() => new SensitiveDataCrypto("dG9vLXNob3J0")).toThrow(SensitiveDataConfigurationError);
  });
});

describe("CacheLookupHmac", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  });

  it("is deterministic and secret-dependent", async () => {
    const first = new CacheLookupHmac(KEY_A);
    const second = new CacheLookupHmac(KEY_B);

    await expect(first.digest("Test")).resolves.toBe(await first.digest("Test"));
    await expect(first.digest("Test")).resolves.not.toBe(await second.digest("Test"));
  });
});
