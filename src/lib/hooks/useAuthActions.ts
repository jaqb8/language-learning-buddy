import { useState } from "react";
import { toast } from "sonner";
import { authClient, AuthClientError } from "@/lib/clients/auth";
import { validateReturnUrl } from "@/lib/utils";
import type {
  LoginFormData,
  SignupFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from "@/lib/validation/auth-schemas";
import { useI18n } from "@/lib/i18n";
import { mapAuthErrorCodeToMessage } from "@/lib/clients/auth/auth.errors";

export function useAuthActions() {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await authClient.login(data);
      toast.success(t("auth.toast.loginSuccess"));

      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("returnUrl");
      const redirectUrl = validateReturnUrl(returnUrl) ?? "/";

      window.location.href = redirectUrl;
    } catch (error) {
      if (error instanceof AuthClientError) {
        toast.error(mapAuthErrorCodeToMessage(error.code, t));
      } else {
        toast.error(t("auth.toast.connectionError"));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await authClient.signup(data);
      toast.success(t("auth.toast.signupSuccess"), {
        duration: 5000,
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      if (error instanceof AuthClientError) {
        toast.error(mapAuthErrorCodeToMessage(error.code, t));
      } else {
        toast.error(t("auth.toast.connectionError"));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authClient.forgotPassword(data);
      toast.success(t("auth.toast.forgotSuccess"));
      return true;
    } catch (error) {
      if (error instanceof AuthClientError) {
        toast.error(mapAuthErrorCodeToMessage(error.code, t));
      } else {
        toast.error(t("auth.toast.connectionError"));
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await authClient.resetPassword(data);
      toast.success(t("auth.toast.resetSuccess"));
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (error) {
      if (error instanceof AuthClientError) {
        toast.error(mapAuthErrorCodeToMessage(error.code, t));
      } else {
        toast.error(t("auth.toast.connectionError"));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    signup,
    forgotPassword,
    resetPassword,
    isLoading,
  };
}
