import { type Page, type Locator } from "@playwright/test";

export class HeaderComponent {
  readonly page: Page;
  readonly logo: Locator;
  readonly analyzeLink: Locator;
  readonly learningListLink: Locator;
  readonly loginButton: Locator;
  readonly signupButton: Locator;
  readonly logoutButton: Locator;
  readonly logoutButtonMobile: Locator;
  readonly userEmail: Locator;
  readonly userAvatar: Locator;
  readonly userMenuTrigger: Locator;
  readonly mobileMenuTrigger: Locator;
  readonly themeToggleButton: Locator;
  readonly themeToggleButtonMobile: Locator;
  readonly themeToggleMenuItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.getByRole("link", { name: /language learning buddy/i });
    this.analyzeLink = page.getByRole("link", { name: /^(analiza|analyse)$/i });
    this.learningListLink = page.getByRole("link", { name: /(moja lista|my list)/i });
    this.loginButton = page.getByTestId("header-login-button");
    this.signupButton = page.getByTestId("header-signup-button");
    this.logoutButton = page.getByTestId("header-logout-button");
    this.logoutButtonMobile = page.getByTestId("header-logout-button-mobile");
    this.userEmail = page.getByTestId("header-user-email");
    this.userAvatar = page.getByTestId("header-user-avatar");
    this.userMenuTrigger = page.getByTestId("header-user-menu-trigger");
    this.mobileMenuTrigger = page.getByTestId("header-mobile-menu-trigger");
    this.themeToggleButton = page.locator("nav button[data-test-id='theme-toggle-button']");
    this.themeToggleButtonMobile = page.locator("div.block button[data-test-id='theme-toggle-button']");
    this.themeToggleMenuItem = page.getByTestId("header-theme-toggle-menu-item");
  }

  async navigateToAnalyze() {
    await this.analyzeLink.click();
  }

  async navigateToLearningList() {
    await this.learningListLink.click();
  }

  async navigateToLogin() {
    await this.loginButton.click();
  }

  async navigateToSignup() {
    await this.signupButton.click();
  }

  async openUserMenu() {
    await this.userMenuTrigger.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  async logoutMobile() {
    await this.openMobileMenu();
    await this.logoutButtonMobile.click();
  }

  async isLoggedIn() {
    return await this.userAvatar.isVisible();
  }

  async getUserEmail() {
    return await this.userEmail.textContent();
  }

  async openMobileMenu() {
    await this.mobileMenuTrigger.click();
  }

  async toggleTheme() {
    const isUserMenuVisible = await this.userMenuTrigger
      .waitFor({ state: "visible", timeout: 1500 })
      .then(() => true)
      .catch(() => false);

    if (isUserMenuVisible) {
      await this.openUserMenu();
      await this.themeToggleMenuItem.click();
      return;
    }

    await this.themeToggleButton.click();
  }

  async toggleThemeMobile() {
    await this.openMobileMenu();
    await this.themeToggleButtonMobile.click();
  }

  async getCurrentTheme() {
    const htmlElement = this.page.locator("html");
    const isDark = await htmlElement.evaluate((el) => el.classList.contains("dark"));
    return isDark ? "dark" : "light";
  }

  async getStoredTheme() {
    return await this.page.evaluate(() => localStorage.getItem("theme"));
  }
}
