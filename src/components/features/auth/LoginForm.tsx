import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";
import { createLoginSchema, type LoginFormData } from "@/lib/validation/auth-schemas";
import { useAuthActions } from "@/lib/hooks/useAuthActions";
import { I18nProvider, useI18n, type AppLocale } from "@/lib/i18n";

export function LoginForm({ locale = "en" }: { locale?: AppLocale }) {
  return (
    <I18nProvider locale={locale}>
      <LoginFormContent />
    </I18nProvider>
  );
}

function LoginFormContent() {
  const { t } = useI18n();
  const schema = useMemo(() => createLoginSchema(t), [t]);
  const { login, isLoading } = useAuthActions();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t("auth.login.title")}</CardTitle>
        <CardDescription>{t("auth.login.description")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
              data-test-id="login-email-input"
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              autoComplete="current-password"
              data-test-id="login-password-input"
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-1">
          <div className="text-sm w-full">
            <a href="/forgot-password" className="text-primary hover:underline">
              {t("auth.login.forgot")}
            </a>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
            aria-busy={isLoading}
            data-test-id="login-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("auth.login.submitting")}
              </>
            ) : (
              <>
                <LogIn className="size-4" /> {t("auth.login.submit")}
              </>
            )}
          </Button>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading}
            size="lg"
            onClick={() => {
              window.location.href = `/api/auth/google${window.location.search}`;
            }}
            data-test-id="login-google-button"
          >
            <svg className="size-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("auth.login.google")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <a href="/signup" className="text-primary hover:underline font-medium">
              {t("auth.signup.submit")}
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
