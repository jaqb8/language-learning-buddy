import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.submitButton = page.locator('[data-test-id="login-submit-button"]');
    this.forgotPasswordLink = page.getByRole("link", { name: /(zapomniałeś hasła|forgot your password)/i });
    this.signupLink = page.getByRole("link", { name: /(zarejestruj się|sign up)/i });
  }

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForRedirect() {
    await this.page.waitForURL("/");
  }

  async hasReturnUrl(): Promise<boolean> {
    const url = this.page.url();
    return url.includes("returnUrl=");
  }

  async getReturnUrl(): Promise<string | null> {
    const url = new URL(this.page.url());
    return url.searchParams.get("returnUrl");
  }

  async waitForRedirectWithReturnUrl() {
    await this.page.waitForURL((url) => url.searchParams.has("restoreAnalysis"));
  }
}
