import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageSelector } from "./LanguageSelector";

describe("LanguageSelector", () => {
  it("renders the compact English selector with a stable test id", () => {
    render(<LanguageSelector locale="en" />);

    expect(screen.getByLabelText("Select application language")).toHaveTextContent("EN");
    expect(document.querySelector('[data-test-id="language-selector"]')).toBeInTheDocument();
  });

  it("renders the full-width Polish selector with its autonym", () => {
    render(<LanguageSelector locale="pl" variant="full" />);

    expect(screen.getByLabelText("Wybierz język aplikacji")).toHaveTextContent("Polski");
    expect(document.querySelector('[data-test-id="language-selector-mobile"]')).toBeInTheDocument();
  });
});
