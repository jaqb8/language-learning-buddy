import { test, expect } from "@playwright/test";
import { AnalyzePage, HeaderComponent } from "./page-objects";

test.describe("Unauthenticated User Tests", () => {
  test.use({ storageState: undefined });

  let analyzePage: AnalyzePage;
  let header: HeaderComponent;

  test.beforeEach(async ({ page }) => {
    analyzePage = new AnalyzePage(page);
    header = new HeaderComponent(page);
  });

  test("should perform analysis as unauthenticated user", async ({ page }) => {
    // Arrange
    const textWithError = "I is a student. He go to school.";

    // Act - Navigate to analyze page
    await analyzePage.goto();
    await expect(analyzePage.heading).toBeVisible();

    // Assert - User is not logged in
    await expect(header.logoutButton).not.toBeVisible();
    await expect(header.loginButton).toBeVisible();

    // Act - Fill and submit analysis
    await analyzePage.form.fillText(textWithError);
    await expect(analyzePage.form.textInput).toHaveValue(textWithError);
    await expect(analyzePage.form.submitButton).toBeEnabled();
    await analyzePage.form.submitAnalysis();

    // Assert - Loading state appears
    await expect(analyzePage.result.loadingState).toBeVisible();

    // Act - Wait for result
    await analyzePage.result.waitForResult();

    // Assert - Result with errors is displayed
    await expect(analyzePage.result.errorResult).toBeVisible();
    await expect(analyzePage.result.explanation).toBeVisible();
    await expect(analyzePage.result.textDiffContainer).toBeVisible();

    // Assert - Original and corrected text are shown
    const originalText = await analyzePage.result.getOriginalText();
    const correctedText = await analyzePage.result.getCorrectedText();
    expect(originalText).toBeTruthy();
    expect(correctedText).toBeTruthy();

    // Assert - Login button is shown instead of save button
    await expect(analyzePage.result.saveButton).toBeVisible();
    const saveButtonText = await analyzePage.result.saveButton.textContent();
    expect(saveButtonText?.toLowerCase()).toMatch(/zaloguj|log in/i);

    // Assert - User is still not logged in
    await expect(header.logoutButton).not.toBeVisible();
    await expect(header.loginButton).toBeVisible();
  });
});
