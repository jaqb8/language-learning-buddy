import { test as setup } from "@playwright/test";
import { LoginPage } from "./page-objects";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const testEmail = process.env.E2E_USERNAME || "test@example.com";
  const testPassword = process.env.E2E_PASSWORD || "password123";

  const loginPage = new LoginPage(page);

  await page.context().addCookies([
    {
      name: "app_locale",
      value: "pl",
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
    },
  ]);

  await loginPage.goto();
  await loginPage.login(testEmail, testPassword);
  await loginPage.waitForRedirect();

  await page.context().storageState({ path: authFile });
});
