import { z } from "zod";
import { createTranslator, type Translator } from "@/lib/i18n";

function createEmailSchema(t: Translator) {
  return z.string().min(1, t("auth.validation.emailRequired")).email(t("auth.validation.emailInvalid"));
}

function createPasswordSchema(t: Translator) {
  return z.string().min(1, t("auth.validation.passwordRequired")).min(6, t("auth.validation.passwordLength"));
}

export function createLoginSchema(t: Translator) {
  return z.object({
    email: createEmailSchema(t),
    password: createPasswordSchema(t),
  });
}

export function createSignupSchema(t: Translator) {
  return z
    .object({
      email: createEmailSchema(t),
      password: createPasswordSchema(t),
      confirmPassword: z.string().min(1, t("auth.validation.confirmRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export function createForgotPasswordSchema(t: Translator) {
  return z.object({
    email: createEmailSchema(t),
  });
}

export function createResetPasswordSchema(t: Translator) {
  return z
    .object({
      password: createPasswordSchema(t),
      confirmPassword: z.string().min(1, t("auth.validation.confirmRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

const defaultTranslator = createTranslator("en");

export const emailSchema = createEmailSchema(defaultTranslator);
export const passwordSchema = createPasswordSchema(defaultTranslator);
export const loginSchema = createLoginSchema(defaultTranslator);
export const signupSchema = createSignupSchema(defaultTranslator);
export const forgotPasswordSchema = createForgotPasswordSchema(defaultTranslator);
export const resetPasswordSchema = createResetPasswordSchema(defaultTranslator);

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type SignupFormData = z.infer<ReturnType<typeof createSignupSchema>>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;
