import { createSupabaseAdminInstance } from "@/db/supabase.admin-client";
import { createCacheLookupHmac, createSensitiveDataCrypto } from "@/lib/crypto/server-crypto";
import { AnalysisCacheService } from "./analysis-cache.service";

export function createAnalysisCacheService(): AnalysisCacheService {
  return new AnalysisCacheService(createSupabaseAdminInstance(), createSensitiveDataCrypto(), createCacheLookupHmac());
}
