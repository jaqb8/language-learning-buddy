import { createTranslator, type Translator } from "@/lib/i18n";

export function mapAuthErrorCodeToMessage(errorCode: string, t: Translator = createTranslator("en")): string {
  const errorMessages: Record<string, string> = {
    validation_error_invalid_email: t("auth.validation.emailInvalid"),
    validation_error_password_too_short: t("auth.validation.passwordLength"),
    authentication_error_missing_code: t("auth.error.missingCode"),
    authentication_error_missing_token: t("auth.error.missingToken"),
    authentication_error_invalid_type: t("auth.error.invalidType"),
    authentication_error_no_session: t("auth.error.noSession"),
    authentication_error_unauthorized: t("error.unauthorized"),
    authentication_error: t("auth.error.operation"),
    unknown_error: t("error.unexpected"),
    invalid_credentials: t("auth.error.invalidCredentials"),
    email_not_confirmed: t("auth.error.emailNotConfirmed"),
    user_not_found: t("auth.error.userNotFound"),
    email_exists: t("auth.error.emailExists"),
    user_already_exists: t("auth.error.emailExists"),
    weak_password: t("auth.error.weakPassword"),
    same_password: t("auth.error.samePassword"),
    otp_expired: t("auth.error.otpExpired"),
    otp_disabled: t("auth.error.otpDisabled"),
    session_not_found: t("auth.error.sessionNotFound"),
    session_expired: t("error.sessionExpired"),
    refresh_token_not_found: t("auth.error.refreshMissing"),
    refresh_token_already_used: t("auth.error.refreshUsed"),
    user_banned: t("auth.error.userBanned"),
    over_request_rate_limit: t("auth.error.tooMany"),
    over_email_send_rate_limit: t("auth.error.tooManyEmails"),
    signup_disabled: t("auth.error.signupDisabled"),
    email_provider_disabled: t("auth.error.emailProviderDisabled"),
    validation_failed: t("auth.error.validation"),
    bad_jwt: t("auth.error.badJwt"),
    captcha_failed: t("auth.error.captcha"),
    email_address_invalid: t("auth.error.emailInvalid"),
    email_address_not_authorized: t("auth.error.emailUnauthorized"),
    feature_not_available: t("auth.error.featureUnavailable"),
  };

  return errorMessages[errorCode] || t("auth.error.operation");
}

export class AuthClientError extends Error {
  constructor(public code: string) {
    super(mapAuthErrorCodeToMessage(code));
    this.name = "AuthClientError";
  }
}
