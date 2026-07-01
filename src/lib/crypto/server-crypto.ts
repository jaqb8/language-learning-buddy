import { CACHE_HMAC_KEY_V1, DATA_ENCRYPTION_KEY_V1 } from "astro:env/server";
import { CacheLookupHmac, SensitiveDataCrypto } from "./sensitive-data.crypto";

export function createSensitiveDataCrypto(): SensitiveDataCrypto {
  return new SensitiveDataCrypto(DATA_ENCRYPTION_KEY_V1);
}

export function createCacheLookupHmac(): CacheLookupHmac {
  return new CacheLookupHmac(CACHE_HMAC_KEY_V1);
}
