import { webcrypto } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const ENVELOPE_PREFIX = "enc:v1";
const IV_BYTES = 12;
const KEY_BYTES = 32;

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function decodeBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(Buffer.from(padded, "base64"));
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function learningItemAad(row) {
  return `learning_items|v1|${row.id}|${row.user_id}|${row.analysis_mode}|${row.analysis_language}`;
}

async function encryptPayload(key, row) {
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = new TextEncoder().encode(
    JSON.stringify({
      original_sentence: row.original_sentence,
      corrected_sentence: row.corrected_sentence,
      explanation: row.explanation,
      translation: row.translation,
    })
  );
  const ciphertext = await webcrypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(learningItemAad(row)),
      tagLength: 128,
    },
    key,
    plaintext
  );

  return `${ENVELOPE_PREFIX}:${encodeBase64Url(iv)}:${encodeBase64Url(new Uint8Array(ciphertext))}`;
}

async function main() {
  const supabaseUrl = requireEnvironment("SUPABASE_URL");
  const supabaseSecretKey = requireEnvironment("SUPABASE_SECRET_KEY");
  const rawEncryptionKey = decodeBase64(requireEnvironment("DATA_ENCRYPTION_KEY_V1"));
  if (rawEncryptionKey.byteLength !== KEY_BYTES) {
    throw new Error("DATA_ENCRYPTION_KEY_V1 must contain exactly 32 bytes encoded as base64");
  }

  const batchSize = Number.parseInt(process.env.BACKFILL_BATCH_SIZE ?? "100", 10);
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
    throw new Error("BACKFILL_BATCH_SIZE must be an integer between 1 and 1000");
  }

  const encryptionKey = await webcrypto.subtle.importKey("raw", rawEncryptionKey, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });

  let encryptedCount = 0;
  while (true) {
    const { data: rows, error: readError } = await supabase
      .from("learning_items")
      .select(
        "id, user_id, original_sentence, corrected_sentence, explanation, translation, analysis_mode, analysis_language"
      )
      .is("encrypted_payload", null)
      .order("id")
      .limit(batchSize);

    if (readError) {
      throw new Error(`Backfill read failed: ${readError.code ?? "unknown"}`);
    }
    if (!rows?.length) {
      break;
    }

    for (const row of rows) {
      if (
        row.original_sentence === null ||
        row.corrected_sentence === null ||
        row.explanation === null ||
        typeof row.analysis_mode !== "string" ||
        typeof row.analysis_language !== "string"
      ) {
        throw new Error(`Learning item ${row.id} has incomplete legacy content`);
      }

      const encryptedPayload = await encryptPayload(encryptionKey, row);
      const { data: updatedRows, error: updateError } = await supabase
        .from("learning_items")
        .update({
          encrypted_payload: encryptedPayload,
          original_sentence: null,
          corrected_sentence: null,
          explanation: null,
          translation: null,
        })
        .eq("id", row.id)
        .eq("user_id", row.user_id)
        .is("encrypted_payload", null)
        .select("id");

      if (updateError) {
        throw new Error(`Backfill update failed for ${row.id}: ${updateError.code ?? "unknown"}`);
      }
      encryptedCount += updatedRows?.length ?? 0;
    }

    console.log(`Encrypted ${encryptedCount} learning items`);
  }

  const { count, error: validationError } = await supabase
    .from("learning_items")
    .select("*", { count: "exact", head: true })
    .or(
      "encrypted_payload.is.null,original_sentence.not.is.null,corrected_sentence.not.is.null,explanation.not.is.null,translation.not.is.null"
    );

  if (validationError) {
    throw new Error(`Backfill validation failed: ${validationError.code ?? "unknown"}`);
  }
  if ((count ?? 0) !== 0) {
    throw new Error(`Backfill incomplete: ${count} learning items remain unencrypted or retain legacy plaintext`);
  }

  console.log(`Backfill complete. Encrypted ${encryptedCount} learning items.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Learning items backfill failed");
  process.exitCode = 1;
});
