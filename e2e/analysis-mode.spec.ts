import { test, expect } from "@playwright/test";
import { AnalyzePage, HeaderComponent, LearningListPage } from "./page-objects";
import { clearLearningItems } from "./helpers/db-cleanup";

test.describe("Analysis Mode Selection and Functionality", () => {
  let analyzePage: AnalyzePage;
  let header: HeaderComponent;
  let learningListPage: LearningListPage;

  test.beforeEach(async ({ page }) => {
    analyzePage = new AnalyzePage(page);
    header = new HeaderComponent(page);
    learningListPage = new LearningListPage(page);
  });

  test("should select and persist analysis mode", async ({ page }) => {
    // Arrange & Act - Navigate to analyze page
    await analyzePage.goto();
    await page.waitForLoadState("networkidle");
    await expect(analyzePage.heading).toBeVisible();

    // Assert - User is logged in (wait for hydration)
    await page.waitForSelector('[data-test-id="header-user-menu-trigger"]', { timeout: 10000 });
    await expect(header.userMenuTrigger).toBeVisible();

    // Assert - Default mode is "Gramatyka i ortografia"
    const defaultMode = await analyzePage.form.getSelectedMode();
    expect(defaultMode).toContain("Gramatyka i ortografia");

    // Act - Change mode to "Mowa potoczna"
    await analyzePage.form.selectMode("colloquial");

    // Assert - Mode changed to "Mowa potoczna"
    const selectedMode = await analyzePage.form.getSelectedMode();
    expect(selectedMode).toContain("Mowa potoczna");

    // Act - Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(analyzePage.heading).toBeVisible();

    // Assert - Mode is persisted (localStorage)
    const persistedMode = await analyzePage.form.getSelectedMode();
    expect(persistedMode).toContain("Mowa potoczna");
  });

  test("should select and persist analysis language", async ({ page }) => {
    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    expect(await analyzePage.form.getSelectedLanguage()).toContain("Angielski");
    await analyzePage.form.selectLanguage("pl");
    expect(await analyzePage.form.getSelectedLanguage()).toContain("Polski");

    await page.reload();
    await expect(analyzePage.heading).toBeVisible();
    expect(await analyzePage.form.getSelectedLanguage()).toContain("Polski");
    await expect(analyzePage.form.textInput).toHaveAttribute(
      "placeholder",
      "Wpisz tutaj swój tekst w języku polskim..."
    );
  });

  test("should analyze Polish text, translate it to English and save its language", async ({ page }) => {
    await clearLearningItems();
    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    await analyzePage.form.selectLanguage("pl");
    await analyzePage.form.selectMode("grammar");
    await analyzePage.form.fillText("Ja lubić czytać książki.");
    await analyzePage.form.submitAnalysis();
    await analyzePage.result.waitForResult();

    await expect(analyzePage.result.errorResult).toBeVisible();
    await analyzePage.result.translationToggle.click();
    await expect(analyzePage.result.translation).toContainText("I like reading books.");

    await analyzePage.result.saveToLearningList();
    await expect(page.getByText(/zapisano na liście do nauki/i)).toBeVisible();

    await header.navigateToLearningList();
    await learningListPage.waitForItems();
    expect(await learningListPage.getFirstItemLanguageBadge()).toContain("Polski");
  });

  test("should analyze text in grammar mode and save with correct badge", async ({ page }) => {
    // Arrange
    const textWithGrammarError = "I is a student. He go to school.";

    // Act - Clean up learning list first
    await clearLearningItems();

    // Act - Navigate to analyze page
    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    // Act - Select "Gramatyka i ortografia" mode
    await analyzePage.form.selectMode("grammar");

    // Act - Fill and submit analysis
    await analyzePage.form.fillText(textWithGrammarError);
    await analyzePage.form.submitAnalysis();

    // Assert - Loading state appears
    await expect(analyzePage.result.loadingState).toBeVisible();

    // Act - Wait for result
    await analyzePage.result.waitForResult();

    // Assert - Result with errors is displayed
    await expect(analyzePage.result.errorResult).toBeVisible();
    await expect(analyzePage.result.explanation).toBeVisible();

    // Act - Save to learning list
    await analyzePage.result.saveToLearningList();

    // Assert - Success toast appears
    await expect(page.getByText(/zapisano na liście do nauki/i)).toBeVisible();

    // Act - Navigate to learning list
    await header.navigateToLearningList();

    // Assert - Item appears in learning list with correct badge
    await expect(learningListPage.heading).toBeVisible();
    await learningListPage.waitForItems();
    const badge = await learningListPage.getFirstItemModeBadge();
    expect(badge).toContain("Gramatyka i ortografia");
  });

  test("should analyze text in colloquial mode and save with correct badge", async ({ page }) => {
    // Arrange
    const formalText = "I request that you provide assistance.";

    // Act - Clean up learning list first
    await clearLearningItems();

    // Act - Navigate to analyze page
    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    // Act - Select "Mowa potoczna" mode
    await analyzePage.form.selectMode("colloquial");

    // Act - Fill and submit analysis
    await analyzePage.form.fillText(formalText);
    await analyzePage.form.submitAnalysis();

    // Assert - Loading state appears
    await expect(analyzePage.result.loadingState).toBeVisible();

    // Act - Wait for result
    await analyzePage.result.waitForResult();

    // Assert - Result with suggestions is displayed
    await expect(analyzePage.result.errorResult).toBeVisible();
    await expect(analyzePage.result.explanation).toBeVisible();
    await expect(analyzePage.result.textDiffContainer).toBeVisible();

    // Assert - Explanation mentions formality or naturalness
    const explanationText = await analyzePage.result.explanation.textContent();
    expect(explanationText?.toLowerCase()).toMatch(/formal|natural|colloquial/i);

    // Act - Save to learning list
    await analyzePage.result.saveToLearningList();

    // Assert - Success toast appears
    await expect(page.getByText(/zapisano na liście do nauki/i)).toBeVisible();

    // Act - Navigate to learning list
    await header.navigateToLearningList();

    // Assert - Item appears in learning list with correct badge
    await expect(learningListPage.heading).toBeVisible();
    await learningListPage.waitForItems();
    const badge = await learningListPage.getFirstItemModeBadge();
    expect(badge).toContain("Mowa potoczna");
  });

  test("should display correct badges for items analyzed in different modes", async ({ page }) => {
    // Arrange
    const grammarText = "She don't like apples.";
    const colloquialText = "I am going to proceed to the location of employment.";

    // Act - Clean up learning list first
    await clearLearningItems();

    // Act - Navigate to analyze page
    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    // Act - Analyze and save in grammar mode
    await analyzePage.form.selectMode("grammar");
    await analyzePage.form.fillText(grammarText);
    await analyzePage.form.submitAnalysis();
    await analyzePage.result.waitForResult();
    await expect(analyzePage.result.errorResult).toBeVisible();
    await analyzePage.result.saveToLearningList();
    await expect(page.getByText(/zapisano na liście do nauki/i)).toBeVisible();

    // Act - Clear and prepare for next analysis
    await page.waitForTimeout(500);
    await analyzePage.form.clearForm();

    // Act - Analyze and save in colloquial mode
    await analyzePage.form.selectMode("colloquial");
    await analyzePage.form.fillText(colloquialText);
    await analyzePage.form.submitAnalysis();
    await analyzePage.result.waitForResult();
    await expect(analyzePage.result.errorResult).toBeVisible();
    await analyzePage.result.saveToLearningList();
    await expect(page.getByText(/zapisano na liście do nauki/i)).toBeVisible();

    // Act - Navigate to learning list
    await header.navigateToLearningList();
    await expect(learningListPage.heading).toBeVisible();
    await learningListPage.waitForItems();

    // Assert - Check that we have at least 2 items
    const itemsCount = await learningListPage.getItemsCount();
    expect(itemsCount).toBeGreaterThanOrEqual(2);

    // Assert - First item (most recent) should have "Mowa potoczna" badge
    const firstBadge = await learningListPage.getFirstItemModeBadge();
    expect(firstBadge).toContain("Mowa potoczna");

    // Assert - Second item should have "Gramatyka i ortografia" badge
    const secondBadge = await learningListPage.getItemModeBadge(1);
    expect(secondBadge).toContain("Gramatyka i ortografia");
  });

  test("should switch modes between analyses correctly", async ({ page }) => {
    // Arrange
    const grammarText = "I is happy.";
    const naturalText = "Hey, what's up? Want to grab some coffee?";

    // Act - Navigate to analyze page
    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    // Act - First analysis in grammar mode
    await analyzePage.form.selectMode("grammar");
    await analyzePage.form.fillText(grammarText);
    await analyzePage.form.submitAnalysis();
    await analyzePage.result.waitForResult();

    // Assert - Error result for grammar issue
    await expect(analyzePage.result.errorResult).toBeVisible();

    // Act - Clear form
    await analyzePage.form.clearForm();
    await page.waitForTimeout(300);

    // Act - Switch to colloquial mode and analyze natural text
    await analyzePage.form.selectMode("colloquial");
    await analyzePage.form.fillText(naturalText);
    await analyzePage.form.submitAnalysis();
    await analyzePage.result.waitForResult();

    // Assert - Correct result for natural colloquial text
    await expect(analyzePage.result.correctResult).toBeVisible();
    await expect(page.getByText(/świetna robota/i)).toBeVisible();

    // Act - Clear and go back to grammar mode
    await analyzePage.form.clearForm();
    await page.waitForTimeout(300);

    // Act - Analyze the same natural text in grammar mode
    await analyzePage.form.selectMode("grammar");
    await analyzePage.form.fillText(naturalText);
    await analyzePage.form.submitAnalysis();
    await analyzePage.result.waitForResult();

    // Assert - Grammar mode should also show correct for grammatically correct text
    await expect(analyzePage.result.correctResult).toBeVisible();
  });
});
