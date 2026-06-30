import { test, expect } from "@playwright/test";
import { AnalyzePage, LoginPage, HeaderComponent } from "./page-objects";
import { SessionStorageHelper } from "./helpers/session-storage";

test.describe("Analysis State Restore After Login", () => {
  test.use({ storageState: undefined });

  let analyzePage: AnalyzePage;
  let loginPage: LoginPage;
  let header: HeaderComponent;
  let sessionStorage: SessionStorageHelper;

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: "app_locale",
        value: "pl",
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);
    analyzePage = new AnalyzePage(page);
    loginPage = new LoginPage(page);
    header = new HeaderComponent(page);
    sessionStorage = new SessionStorageHelper(page);
  });

  test("should restore analysis state after login - basic flow with errors", async ({ page }) => {
    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "password123";
    const textWithError = "Ja lubić czytać książki.";

    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    await expect(header.logoutButton).not.toBeVisible();

    await analyzePage.form.selectLanguage("pl");
    await analyzePage.form.selectMode("grammar");
    await analyzePage.form.fillText(textWithError);
    await analyzePage.form.submitAnalysis();

    await analyzePage.result.waitForLoading();
    await analyzePage.result.waitForResult();

    await expect(analyzePage.result.errorResult).toBeVisible();
    await expect(analyzePage.result.explanation).toBeVisible();

    await analyzePage.result.clickLoginToSave();

    await expect(page).toHaveURL(/\/login\?returnUrl=/);
    const returnUrl = await loginPage.getReturnUrl();
    expect(returnUrl).toContain("restoreAnalysis=true");

    const hasPendingAnalysis = await sessionStorage.hasPendingAnalysis();
    expect(hasPendingAnalysis).toBe(true);

    const pendingAnalysisData = await sessionStorage.getPendingAnalysis();
    expect(pendingAnalysisData).not.toBeNull();
    expect((pendingAnalysisData as { originalText: string }).originalText).toBe(textWithError);

    await loginPage.login(testEmail, testPassword);

    await page.waitForURL((url) => url.searchParams.get("restoreAnalysis") === "true");

    await expect(analyzePage.heading).toBeVisible();

    await page.waitForTimeout(1000);

    await expect(analyzePage.result.errorResult).toBeVisible();

    const restoredText = await analyzePage.getTextInputValue();
    expect(restoredText).toBe(textWithError);
    expect(await analyzePage.form.getSelectedLanguage()).toContain("Polski");

    await page.waitForURL((url) => !url.searchParams.has("restoreAnalysis"), { timeout: 3000 });

    const hasRestoreParam = await analyzePage.hasRestoreAnalysisParam();
    expect(hasRestoreParam).toBe(false);

    const hasPendingAnalysisAfterRestore = await sessionStorage.hasPendingAnalysis();
    expect(hasPendingAnalysisAfterRestore).toBe(false);

    await analyzePage.result.waitForSaveButton();
    await expect(analyzePage.result.saveButton).toContainText(/dodaj do listy/i);

    await analyzePage.result.saveToLearningList();

    await expect(page.getByText(/zapisano na liście do nauki/i)).toBeVisible();
    await expect(analyzePage.result.saveButton).toContainText(/zapisano/i);
  });

  test("should restore analysis state with colloquial speech mode", async ({ page }) => {
    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "password123";
    const text = "I request that you provide assistance.";

    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    await analyzePage.form.selectMode("colloquial");
    await analyzePage.form.fillText(text);
    await analyzePage.form.submitAnalysis();

    await analyzePage.result.waitForLoading();
    await analyzePage.result.waitForResult();

    await expect(analyzePage.result.errorResult).toBeVisible();

    const selectedModeBefore = await analyzePage.form.getSelectedMode();
    expect(selectedModeBefore).toContain("Mowa potoczna");

    await analyzePage.result.clickLoginToSave();

    await expect(page).toHaveURL(/\/login\?returnUrl=/);

    await loginPage.login(testEmail, testPassword);

    await page.waitForURL((url) => url.searchParams.get("restoreAnalysis") === "true");

    await expect(analyzePage.heading).toBeVisible();

    await page.waitForTimeout(1000);

    await expect(analyzePage.result.errorResult).toBeVisible();

    const selectedModeAfter = await analyzePage.form.getSelectedMode();
    expect(selectedModeAfter).toContain("Mowa potoczna");

    const restoredText = await analyzePage.getTextInputValue();
    expect(restoredText).toBe(text);

    await expect(analyzePage.result.errorResult).toBeVisible();
  });

  test("should not restore analysis state when returning without login", async ({ page }) => {
    const textWithError = "I is a student. He go to school.";

    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    await analyzePage.form.fillText(textWithError);
    await analyzePage.form.submitAnalysis();

    await analyzePage.result.waitForLoading();
    await analyzePage.result.waitForResult();

    await expect(analyzePage.result.errorResult).toBeVisible();

    await analyzePage.result.clickLoginToSave();

    await expect(page).toHaveURL(/\/login\?returnUrl=/);

    const hasPendingAnalysis = await sessionStorage.hasPendingAnalysis();
    expect(hasPendingAnalysis).toBe(true);

    await analyzePage.goto();

    await expect(analyzePage.heading).toBeVisible();

    const hasRestoreParam = await analyzePage.hasRestoreAnalysisParam();
    expect(hasRestoreParam).toBe(false);

    const textInputValue = await analyzePage.getTextInputValue();
    expect(textInputValue).toBe("");

    await expect(analyzePage.result.errorResult).not.toBeVisible();

    const hasPendingAnalysisAfterReturn = await sessionStorage.hasPendingAnalysis();
    expect(hasPendingAnalysisAfterReturn).toBe(true);
  });

  test("should handle empty sessionStorage gracefully", async ({ page }) => {
    await page.goto("/");
    await sessionStorage.clear();

    await page.goto("/?restoreAnalysis=true");

    await expect(analyzePage.heading).toBeVisible();

    const hasRestoreParam = await analyzePage.hasRestoreAnalysisParam();
    expect(hasRestoreParam).toBe(true);

    await page.waitForTimeout(1000);

    const textInputValue = await analyzePage.getTextInputValue();
    expect(textInputValue).toBe("");

    await expect(analyzePage.result.errorResult).not.toBeVisible();

    const hasPendingAnalysis = await sessionStorage.hasPendingAnalysis();
    expect(hasPendingAnalysis).toBe(false);
  });
});
