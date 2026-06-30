import { Menu, Settings } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GamificationBadge } from "@/components/features/gamification/GamificationBadge";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { LanguageSelector, LanguageSelectorLabel } from "@/components/shared/LanguageSelector";
import { useI18n } from "@/lib/i18n";
import type { HeaderVM } from "./header.model";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

const getInitials = (email: string): string => {
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
};

export function HeaderMobile({ vm }: { vm: HeaderVM }) {
  const { locale, t } = useI18n();

  return (
    <div className="block lg:hidden">
      <div className="flex items-center justify-between px-4">
        <a href={vm.logo.url} className="flex items-center gap-2" data-test-id="header-logo-mobile">
          <img src={vm.logo.src} className="max-h-8 dark:invert" alt={vm.logo.alt} />
        </a>

        <div className="flex items-center gap-2">
          {vm.auth.kind === "authenticated" && (
            <>
              {vm.auth.pointsBadge.kind === "loading" && <GamificationBadge isLoading />}
              {vm.auth.pointsBadge.kind === "visible" && (
                <GamificationBadge
                  correctAnalyses={vm.auth.pointsBadge.correctAnalyses}
                  totalAnalyses={vm.auth.pointsBadge.totalAnalyses}
                  showBeta={vm.auth.pointsBadge.showBeta}
                />
              )}
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                data-test-id="header-mobile-menu-trigger"
                aria-label={t("header.openMenu")}
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <a href={vm.logo.url} className="flex items-center gap-2">
                    <img src={vm.logo.src} className="max-h-8 dark:invert" alt={vm.logo.alt} />
                  </a>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 p-4">
                {vm.menu.length > 0 && (
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                    {vm.menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                )}

                <div className="flex flex-col gap-3">
                  {vm.auth.kind === "authenticated" && (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10" data-test-id="header-user-avatar-mobile">
                          <AvatarImage src={vm.auth.user.avatarUrl ?? undefined} alt={vm.auth.user.email} />
                          <AvatarFallback>{getInitials(vm.auth.user.email)}</AvatarFallback>
                        </Avatar>
                        <span className="text-md text-muted-foreground" data-test-id="header-user-email-mobile">
                          {vm.auth.user.email}
                        </span>
                      </div>
                      <Button asChild variant="outline" className="w-full" data-test-id="header-settings-button-mobile">
                        <a href="/settings" className="flex items-center justify-center gap-2">
                          <Settings className="size-4" />
                          {t("header.settings")}
                        </a>
                      </Button>
                      <form action="/api/auth/logout" method="POST">
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full"
                          data-test-id="header-logout-button-mobile"
                        >
                          {t("header.logout")}
                        </Button>
                      </form>
                    </>
                  )}

                  {vm.auth.kind === "unauthenticated" && (
                    <>
                      <Button asChild variant="outline" data-test-id="header-login-button-mobile">
                        <a href="/login">{t("header.login")}</a>
                      </Button>
                      <Button asChild data-test-id="header-signup-button-mobile">
                        <a href="/signup">{t("header.signup")}</a>
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <LanguageSelectorLabel locale={locale} />
                  <LanguageSelector locale={locale} variant="full" />
                </div>
                <ModeToggle>{t("theme.toggle")}</ModeToggle>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

function renderMobileMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">{item.title}</AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <a
      key={item.title}
      href={item.url}
      className="text-md font-semibold"
      data-test-id={`header-nav-mobile-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {item.title}
    </a>
  );
}

function SubMenuLink({ item }: { item: MenuItem }) {
  return (
    <a
      className="hover:bg-muted hover:text-accent-foreground flex min-w-80 select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors"
      href={item.url}
    >
      <div className="text-foreground">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && <p className="text-muted-foreground text-sm leading-snug">{item.description}</p>}
      </div>
    </a>
  );
}
