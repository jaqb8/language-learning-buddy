import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AnalysisLanguageSelector } from "./AnalysisLanguageSelector";
import { useAnalysisLanguageStore } from "@/lib/stores/analysis-language.store";
import { I18nProvider } from "@/lib/i18n";

describe("AnalysisLanguageSelector", () => {
  beforeEach(() => {
    localStorage.clear();
    useAnalysisLanguageStore.setState({ language: "en" });
  });

  it("defaults to English and persists a Polish selection", async () => {
    const user = userEvent.setup();
    render(<AnalysisLanguageSelector />);

    const selector = screen.getByRole("combobox", { name: "Text language" });
    expect(selector).toHaveTextContent("English");
    expect(screen.getByTestId("language-flag-en")).toBeInTheDocument();

    await user.click(selector);
    expect(screen.getByRole("option", { name: "English" })).toContainElement(
      screen.getAllByTestId("language-flag-en")[1]
    );
    expect(screen.getByRole("option", { name: "Polish" })).toContainElement(screen.getByTestId("language-flag-pl"));
    await user.click(screen.getByRole("option", { name: "Polish" }));

    expect(selector).toHaveTextContent("Polish");
    expect(screen.getByTestId("language-flag-pl")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("analysis_language") ?? "{}")).toMatchObject({
      state: { language: "pl" },
    });
  });

  it("renders Polish labels when the application locale is Polish", () => {
    render(
      <I18nProvider locale="pl">
        <AnalysisLanguageSelector />
      </I18nProvider>
    );

    expect(screen.getByRole("combobox", { name: "Język tekstu" })).toHaveTextContent("Angielski");
  });
});
