import { expect, test } from "@playwright/test";
import { HeaderComponent } from "./page-objects";

test.describe("Application language", () => {
  test.use({ storageState: undefined, locale: "pl-PL" });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("defaults to English and persists Polish on the same URLs", async ({ page, context }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Text analysis - Language Learning Buddy");
    await expect(page.getByRole("heading", { name: "Text analysis" })).toBeVisible();

    const header = new HeaderComponent(page);
    await header.waitForHydration();
    const preferences = page.getByTestId("header-preferences");
    const languageSelector = preferences.getByTestId("language-selector");
    await expect(languageSelector).toBeVisible();
    await expect(preferences.getByTestId("theme-toggle-button")).toBeVisible();

    await languageSelector.click();
    await page.getByTestId("language-option-pl").click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page.getByRole("heading", { name: "Analiza tekstu" })).toBeVisible();
    expect((await context.cookies()).find((cookie) => cookie.name === "app_locale")?.value).toBe("pl");

    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page).toHaveTitle("Logowanie - Language Learning Buddy");
  });

  test("shows the language selector in the mobile navigation sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const header = new HeaderComponent(page);
    await header.openMobileMenu();
    const menu = page.getByRole("dialog");
    await expect(menu.getByTestId("language-selector-mobile")).toBeVisible();
    await expect(menu.getByTestId("theme-toggle-button")).toBeVisible();
  });
});

test.describe("Authenticated language menu", () => {
  test("offers language choices inside the email menu", async ({ page }) => {
    await page.goto("/");
    const header = new HeaderComponent(page);
    await header.openUserMenu();

    await expect(page.getByTestId("header-language-menu-item")).toBeVisible();
    await page.getByTestId("header-language-menu-item").hover();
    await expect(page.getByTestId("header-language-option-en")).toBeVisible();
    await expect(page.getByTestId("header-language-option-pl")).toBeVisible();
  });
});
