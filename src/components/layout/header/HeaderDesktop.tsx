import { ChevronDown, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { GamificationBadge } from "@/components/features/gamification/GamificationBadge";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { UserMenuThemeToggle } from "@/components/shared/UserMenuThemeToggle";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { UserMenuLanguageSelector } from "@/components/shared/UserMenuLanguageSelector";
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

export function HeaderDesktop({ vm }: { vm: HeaderVM }) {
  const { locale, t } = useI18n();

  return (
    <nav className="hidden justify-between lg:flex container mx-auto items-center">
      <div className="flex items-center gap-6">
        <a href={vm.logo.url} className="flex items-center gap-2" data-test-id="header-logo">
          <img src={vm.logo.src} className="max-h-8 dark:invert" alt={vm.logo.alt} />
          <span className="text-xl font-semibold tracking-tighter">{vm.logo.title}</span>
        </a>
        {vm.menu.length > 0 && (
          <div className="flex items-center">
            <NavigationMenu>
              <NavigationMenuList>{vm.menu.map((item) => renderMenuItem(item))}</NavigationMenuList>
            </NavigationMenu>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {vm.auth.kind === "unauthenticated" && <DesktopAuthButtons />}
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

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  className="group shadow-xs cursor-pointer flex items-center gap-2 border rounded-full py-1 pl-1 pr-3 dark:bg-secondary/50 hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-test-id="header-user-menu-trigger"
                >
                  <Avatar className="size-6" data-test-id="header-user-avatar">
                    <AvatarImage src={vm.auth.user.avatarUrl ?? undefined} alt={vm.auth.user.email} />
                    <AvatarFallback>{getInitials(vm.auth.user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground font-medium" data-test-id="header-user-email">
                    {vm.auth.user.email}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-2 shadow-lg border"
                data-test-id="header-user-menu-content"
              >
                <DropdownMenuItem asChild>
                  <a href="/settings" className="cursor-pointer" data-test-id="header-settings-button">
                    <Settings className="size-4" />
                    <span>{t("header.settings")}</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <UserMenuLanguageSelector />
                <UserMenuThemeToggle />
                <DropdownMenuSeparator />
                <form action="/api/auth/logout" method="POST">
                  <DropdownMenuItem
                    asChild
                    variant="destructive"
                    className="cursor-pointer"
                    data-test-id="header-logout-button"
                  >
                    <button type="submit" className="w-full flex items-center gap-2">
                      <LogOut className="size-4" />
                      <span>{t("header.logout")}</span>
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {vm.showModeToggleDesktop ? (
          <div className="flex items-center gap-2" data-test-id="header-preferences">
            <LanguageSelector locale={locale} />
            <ModeToggle />
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function DesktopAuthButtons() {
  const { t } = useI18n();
  return (
    <>
      <Button asChild variant="outline" size="sm" data-test-id="header-login-button">
        <a href="/login">{t("header.login")}</a>
      </Button>
      <Button asChild size="sm" data-test-id="header-signup-button">
        <a href="/signup">{t("header.signup")}</a>
      </Button>
    </>
  );
}

function renderMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-popover text-popover-foreground">
          {item.items.map((subItem) => (
            <NavigationMenuLink asChild key={subItem.title} className="w-80">
              <SubMenuLink item={subItem} />
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className="bg-background hover:bg-muted hover:text-accent-foreground group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-lg font-medium transition-colors"
        data-test-id={`header-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
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
