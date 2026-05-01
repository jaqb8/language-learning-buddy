import { type Page, type Locator } from "@playwright/test";

export class LearningListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emptyState: Locator;
  readonly learningItems: Locator;
  readonly deleteButtons: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrevious: Locator;
  readonly modeBadges: Locator;
  readonly itemCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /lista wyrażeń do nauki/i });
    this.emptyState = page.getByText(/brak wyrażeń do nauki/i);
    this.learningItems = page.locator("[data-learning-item]");
    this.deleteButtons = page.getByRole("button", { name: /usuń/i });
    this.confirmDeleteButton = page.getByRole("button", { name: /tak, usuń/i });
    this.cancelDeleteButton = page.getByRole("button", { name: /anuluj/i });
    this.paginationNext = page.getByRole("button", { name: /następna/i });
    this.paginationPrevious = page.getByRole("button", { name: /poprzednia/i });
    this.itemCards = page.getByTestId("learning-item-card");
    this.modeBadges = this.itemCards.getByTestId("analysis-mode-badge");
  }

  async goto() {
    await this.page.goto("/learning-list");
    await this.page.waitForLoadState("networkidle");
  }

  async waitForItems() {
    await this.learningItems.first().waitFor({ state: "visible" });
  }

  async hasItems() {
    return (await this.learningItems.count()) > 0;
  }

  async getItemsCount() {
    return await this.itemCards.count();
  }

  async deleteFirstItem() {
    await this.deleteButtons.first().click();
    await this.confirmDeleteButton.click();
  }

  async getFirstItemOriginalText() {
    return await this.learningItems.first().locator("text=/oryginalny/i").textContent();
  }

  async goToNextPage() {
    await this.paginationNext.click();
  }

  async goToPreviousPage() {
    await this.paginationPrevious.click();
  }

  async getFirstItemModeBadge() {
    const badge = this.itemCards.first().getByTestId("analysis-mode-badge");
    await badge.waitFor({ state: "visible" });
    return await badge.textContent();
  }

  async getItemModeBadge(index: number) {
    const badge = this.itemCards.nth(index).getByTestId("analysis-mode-badge");
    await badge.waitFor({ state: "visible" });
    return await badge.textContent();
  }
}
