import { type Page } from "@playwright/test";
import { AnalysisFormComponent } from "./AnalysisFormComponent";
import { AnalysisResultComponent } from "./AnalysisResultComponent";

export class AnalyzePage {
  readonly page: Page;
  readonly form: AnalysisFormComponent;
  readonly result: AnalysisResultComponent;
  readonly heading: any;

  constructor(page: Page) {
    this.page = page;
    this.form = new AnalysisFormComponent(page);
    this.result = new AnalysisResultComponent(page);
    this.heading = page.getByRole("heading", { name: /(analiza tekstu|text analysis)/i });
  }

  async goto() {
    await this.page.goto("/");
  }

  async analyzeText(text: string) {
    await this.form.fillText(text);
    await this.form.submitAnalysis();
    await this.result.waitForLoading();
    await this.result.waitForResult();
  }

  async analyzeAndSave(text: string) {
    await this.analyzeText(text);
    if (await this.result.hasErrors()) {
      await this.result.saveToLearningList();
    }
  }

  async getTextInputValue(): Promise<string> {
    return await this.form.textInput.inputValue();
  }

  async hasRestoreAnalysisParam(): Promise<boolean> {
    const url = new URL(this.page.url());
    return url.searchParams.get("restoreAnalysis") === "true";
  }
}
