import { Languages } from "lucide-react";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageFlag } from "@/components/shared/LanguageFlag";
import { setAppLocaleCookie, useI18n } from "@/lib/i18n";

export function UserMenuLanguageSelector() {
  const { locale, t } = useI18n();

  const handleValueChange = (value: string) => {
    if (value !== "en" && value !== "pl") return;
    setAppLocaleCookie(value);
    window.location.reload();
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="cursor-pointer" data-test-id="header-language-menu-item">
        <Languages className="size-4" />
        <span>{t("language.label")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={locale} onValueChange={handleValueChange}>
          <DropdownMenuRadioItem value="en" data-test-id="header-language-option-en" className="cursor-pointer">
            <LanguageFlag language="en" />
            {t("language.english")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="pl" data-test-id="header-language-option-pl" className="cursor-pointer">
            <LanguageFlag language="pl" />
            {t("language.polish")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
