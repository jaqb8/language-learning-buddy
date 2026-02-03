import { type Page } from "@playwright/test";

export class SessionStorageHelper {
  constructor(private page: Page) {}

  async getItem(key: string): Promise<string | null> {
    return await this.page.evaluate((storageKey) => {
      return sessionStorage.getItem(storageKey);
    }, key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ([storageKey, storageValue]) => {
        sessionStorage.setItem(storageKey, storageValue);
      },
      [key, value]
    );
  }

  async removeItem(key: string): Promise<void> {
    await this.page.evaluate((storageKey) => {
      sessionStorage.removeItem(storageKey);
    }, key);
  }

  async clear(): Promise<void> {
    await this.page.evaluate(() => {
      sessionStorage.clear();
    });
  }

  async getPendingAnalysis(): Promise<unknown> {
    const data = await this.getItem("pending_analysis");
    if (!data) {
      return null;
    }
    try {
      const parsed = JSON.parse(data) as { state?: { pendingAnalysis?: unknown }; version?: number };
      return parsed.state?.pendingAnalysis ?? null;
    } catch {
      return null;
    }
  }

  async hasPendingAnalysis(): Promise<boolean> {
    const data = await this.getPendingAnalysis();
    return data !== null;
  }
}
