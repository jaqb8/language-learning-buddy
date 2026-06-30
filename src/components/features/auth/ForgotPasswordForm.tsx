import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { createForgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validation/auth-schemas";
import { useAuthActions } from "@/lib/hooks/useAuthActions";
import { mapAuthErrorCodeToMessage } from "@/lib/clients/auth/auth.errors";
import { I18nProvider, useI18n, type AppLocale } from "@/lib/i18n";

export function ForgotPasswordForm({ locale = "en" }: { locale?: AppLocale }) {
  return (
    <I18nProvider locale={locale}>
      <ForgotPasswordFormContent />
    </I18nProvider>
  );
}

function ForgotPasswordFormContent() {
  const { t } = useI18n();
  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);
  const [isSuccess, setIsSuccess] = useState(false);
  const { forgotPassword, isLoading } = useAuthActions();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error");

    if (errorCode) {
      const errorMessage = mapAuthErrorCodeToMessage(errorCode, t);
      toast.error(errorMessage);

      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [t]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const success = await forgotPassword(data);
    if (success) {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("auth.forgot.checkTitle")}</CardTitle>
          <CardDescription>{t("auth.forgot.checkDescription")}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full" size="lg">
            <a href="/login">{t("auth.forgot.back")}</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t("auth.forgot.title")}</CardTitle>
        <CardDescription>{t("auth.forgot.description")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              {...register("email")}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-6">
          <Button type="submit" className="w-full" disabled={isLoading} size="lg" aria-busy={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("auth.forgot.submitting")}
              </>
            ) : (
              <>
                <Mail className="size-4" /> {t("auth.forgot.submit")}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.forgot.remember")}{" "}
            <a href="/login" className="text-primary hover:underline font-medium">
              {t("auth.login.submit")}
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
