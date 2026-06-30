import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalysisLanguageBadge } from "./AnalysisLanguageBadge";

describe("AnalysisLanguageBadge", () => {
  it.each([
    ["en", "English"],
    ["pl", "Polish"],
  ] as const)("renders the %s flag with an accessible label", (language, label) => {
    render(<AnalysisLanguageBadge language={language} />);

    expect(screen.getByTestId(`language-flag-${language}`)).toBeInTheDocument();
    expect(screen.getByText(label)).toHaveClass("sr-only");
  });

  it("falls back to the English flag for an unknown language", () => {
    render(<AnalysisLanguageBadge language="unknown" />);

    expect(screen.getByTestId("language-flag-en")).toBeInTheDocument();
  });
});
