import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { createResetPasswordSchema, type ResetPasswordFormData } from "@/lib/validation/auth-schemas";
import { useAuthActions } from "@/lib/hooks/useAuthActions";
import { I18nProvider, useI18n, type AppLocale } from "@/lib/i18n";

export function ResetPasswordForm({ locale = "en" }: { locale?: AppLocale }) {
  return (
    <I18nProvider locale={locale}>
      <ResetPasswordFormContent />
    </I18nProvider>
  );
}

function ResetPasswordFormContent() {
  const { t } = useI18n();
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);
  const { resetPassword, isLoading } = useAuthActions();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    await resetPassword(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t("auth.reset.title")}</CardTitle>
        <CardDescription>{t("auth.reset.description")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.newPassword")}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              autoComplete="new-password"
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("auth.confirmNewPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-6">
          <Button type="submit" className="w-full" disabled={isLoading} size="lg" aria-busy={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("auth.reset.submitting")}
              </>
            ) : (
              <>
                <Lock className="size-4" /> {t("auth.reset.submit")}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
