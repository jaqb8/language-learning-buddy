const ENVELOPE_PREFIX = "enc:v1";
const AES_GCM_IV_BYTES = 12;
const AES_256_KEY_BYTES = 32;

export class SensitiveDataConfigurationError extends Error {
  constructor() {
    super("sensitive_data_configuration_error");
    this.name = "SensitiveDataConfigurationError";
  }
}

export class SensitiveDataDecryptionError extends Error {
  constructor() {
    super("sensitive_data_decryption_error");
    this.name = "SensitiveDataDecryptionError";
  }
}

function decodeBase64(value: string): Uint8Array {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = globalThis.atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new SensitiveDataConfigurationError();
  }
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return globalThis.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  try {
    return decodeBase64(value);
  } catch {
    throw new SensitiveDataDecryptionError();
  }
}

function requireWebCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new SensitiveDataConfigurationError();
  }

  return globalThis.crypto;
}

export class SensitiveDataCrypto {
  private readonly rawKey: Uint8Array;
  private encryptionKey?: Promise<CryptoKey>;

  constructor(encodedKey: string) {
    this.rawKey = decodeBase64(encodedKey);
    if (this.rawKey.byteLength !== AES_256_KEY_BYTES) {
      throw new SensitiveDataConfigurationError();
    }
  }

  async encryptJson(value: unknown, additionalAuthenticatedData: string): Promise<string> {
    const crypto = requireWebCrypto();
    const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: new TextEncoder().encode(additionalAuthenticatedData),
        tagLength: 128,
      },
      await this.getEncryptionKey(),
      plaintext
    );

    return `${ENVELOPE_PREFIX}:${encodeBase64Url(iv)}:${encodeBase64Url(new Uint8Array(ciphertext))}`;
  }

  async decryptJson<T>(envelope: string, additionalAuthenticatedData: string): Promise<T> {
    try {
      const [prefix, version, encodedIv, encodedCiphertext, ...remainder] = envelope.split(":");
      if (prefix !== "enc" || version !== "v1" || !encodedIv || !encodedCiphertext || remainder.length > 0) {
        throw new SensitiveDataDecryptionError();
      }

      const iv = decodeBase64Url(encodedIv);
      if (iv.byteLength !== AES_GCM_IV_BYTES) {
        throw new SensitiveDataDecryptionError();
      }

      const plaintext = await requireWebCrypto().subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
          additionalData: new TextEncoder().encode(additionalAuthenticatedData),
          tagLength: 128,
        },
        await this.getEncryptionKey(),
        decodeBase64Url(encodedCiphertext)
      );

      return JSON.parse(new TextDecoder().decode(plaintext)) as T;
    } catch (error) {
      if (error instanceof SensitiveDataDecryptionError) {
        throw error;
      }
      throw new SensitiveDataDecryptionError();
    }
  }

  private getEncryptionKey(): Promise<CryptoKey> {
    this.encryptionKey ??= requireWebCrypto().subtle.importKey("raw", this.rawKey, { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
    ]);

    return this.encryptionKey;
  }
}

export class CacheLookupHmac {
  private readonly rawKey: Uint8Array;
  private hmacKey?: Promise<CryptoKey>;

  constructor(encodedKey: string) {
    this.rawKey = decodeBase64(encodedKey);
    if (this.rawKey.byteLength !== AES_256_KEY_BYTES) {
      throw new SensitiveDataConfigurationError();
    }
  }

  async digest(value: string): Promise<string> {
    const signature = await requireWebCrypto().subtle.sign(
      "HMAC",
      await this.getHmacKey(),
      new TextEncoder().encode(value)
    );

    return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  private getHmacKey(): Promise<CryptoKey> {
    this.hmacKey ??= requireWebCrypto().subtle.importKey("raw", this.rawKey, { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
    ]);

    return this.hmacKey;
  }
}

export function learningItemAad(id: string, userId: string, analysisMode: string, analysisLanguage: string): string {
  return `learning_items|v1|${id}|${userId}|${analysisMode}|${analysisLanguage}`;
}

export function analysisCacheAad(lookupDigest: string, analysisMode: string, analysisLanguage: string): string {
  return `analysis_cache|v1|${lookupDigest}|${analysisMode}|${analysisLanguage}`;
}

export function createSensitiveRecordId(): string {
  return requireWebCrypto().randomUUID();
}
