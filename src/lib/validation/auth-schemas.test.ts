import { describe, expect, it } from "vitest";
import { createTranslator } from "@/lib/i18n";
import { createLoginSchema, createSignupSchema } from "./auth-schemas";

describe("localized auth schemas", () => {
  it("returns English validation messages by default", () => {
    const result = createLoginSchema(createTranslator("en")).safeParse({ email: "", password: "" });

    expect(result.error?.issues.map((issue) => issue.message)).toContain("Email is required");
    expect(result.error?.issues.map((issue) => issue.message)).toContain("Password is required");
  });

  it("returns Polish validation and refinement messages", () => {
    const result = createSignupSchema(createTranslator("pl")).safeParse({
      email: "person@example.com",
      password: "password",
      confirmPassword: "innehaslo",
    });

    expect(result.error?.issues.map((issue) => issue.message)).toContain("Hasła muszą być identyczne");
  });
});
