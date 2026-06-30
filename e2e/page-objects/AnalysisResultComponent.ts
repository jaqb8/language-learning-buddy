import { type Page, type Locator } from "@playwright/test";

export class AnalysisResultComponent {
  readonly page: Page;
  readonly loadingState: Locator;
  readonly correctResult: Locator;
  readonly errorResult: Locator;
  readonly explanation: Locator;
  readonly saveButton: Locator;
  readonly textDiffContainer: Locator;
  readonly originalText: Locator;
  readonly correctedText: Locator;
  readonly translationToggle: Locator;
  readonly translation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadingState = page.getByRole("status", { name: /(ładowanie wyników analizy|loading analysis results)/i });
    this.correctResult = page.getByRole("status", {
      name: /(wynik analizy - tekst poprawny|analysis result - text is correct)/i,
    });
    this.errorResult = page.getByRole("article", {
      name: /(wynik analizy - znaleziono błędy|analysis result - issues found)/i,
    });
    this.explanation = page.locator(".rounded-md.bg-muted.p-3").filter({ hasText: /.+/ }).first();
    this.saveButton = page.getByRole("button", {
      name: /dodaj.*do listy|element już zapisany|zaloguj się.*dodać|add.*learning list|item already saved|log in to add/i,
    });
    this.textDiffContainer = page.getByRole("region", { name: /(porównanie tekstu|comparison of the original)/i });
    this.originalText = page.getByLabel(
      /(tekst oryginalny z zaznaczonymi błędami|original text with highlighted issues)/i
    );
    this.correctedText = page.getByLabel(
      /(tekst poprawiony z zaznaczonymi zmianami|corrected text with highlighted changes)/i
    );
    this.translationToggle = page.getByTestId("toggle-translation-button");
    this.translation = page.getByTestId("text-diff-translation");
  }

  async waitForLoading() {
    await this.loadingState.waitFor({ state: "visible" });
  }

  async waitForResult() {
    await this.loadingState.waitFor({ state: "hidden" });
  }

  async isCorrectResult() {
    return await this.correctResult.isVisible();
  }

  async hasErrors() {
    return await this.errorResult.isVisible();
  }

  async getExplanation() {
    return await this.explanation.textContent();
  }

  async saveToLearningList() {
    await this.saveButton.click();
  }

  async isSaved() {
    const buttonText = await this.saveButton.textContent();
    return /Zapisano|Saved/.test(buttonText ?? "");
  }

  async getOriginalText() {
    return await this.originalText.textContent();
  }

  async getCorrectedText() {
    return await this.correctedText.textContent();
  }

  async waitForSaveButton() {
    await this.saveButton.waitFor({ state: "visible" });
  }

  async clickLoginToSave() {
    await this.saveButton.click();
  }

  async isRestored(): Promise<boolean> {
    const url = new URL(this.page.url());
    return !url.searchParams.has("restoreAnalysis");
  }
}
