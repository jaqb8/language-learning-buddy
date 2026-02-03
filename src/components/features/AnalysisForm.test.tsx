import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { AnalysisForm } from "./AnalysisForm";

describe("AnalysisForm", () => {
  it("disables Clear button when text is empty (idle)", () => {
    render(
      <AnalysisForm
        text=""
        onTextChange={vi.fn()}
        onSubmit={vi.fn()}
        onClear={vi.fn()}
        isLoading={false}
        isAnalyzing={false}
        maxLength={500}
        quota={null}
        formatResetTime={() => ""}
        analysisContext=""
        onAnalysisContextChange={vi.fn()}
        isAuth={true}
      />
    );

    expect(screen.getByRole("button", { name: /wyczyść/i })).toBeDisabled();
  });

  it("allows opening context accordion in idle, but keeps its textarea disabled", async () => {
    const user = userEvent.setup();

    render(
      <AnalysisForm
        text=""
        onTextChange={vi.fn()}
        onSubmit={vi.fn()}
        onClear={vi.fn()}
        isLoading={false}
        isAnalyzing={false}
        maxLength={500}
        quota={null}
        formatResetTime={() => ""}
        analysisContext=""
        onAnalysisContextChange={vi.fn()}
        isAuth={true}
      />
    );

    const contextTrigger = screen.getByRole("button", { name: /kontekst/i });
    expect(contextTrigger).toBeEnabled();

    await user.click(contextTrigger);

    expect(screen.getByPlaceholderText(/wpisz tutaj dodatkowy kontekst/i)).toBeDisabled();
  });

  it("enables Clear button when text is non-empty and not analyzing", () => {
    render(
      <AnalysisForm
        text="Hello"
        onTextChange={vi.fn()}
        onSubmit={vi.fn()}
        onClear={vi.fn()}
        isLoading={false}
        isAnalyzing={false}
        maxLength={500}
        quota={null}
        formatResetTime={() => ""}
        analysisContext=""
        onAnalysisContextChange={vi.fn()}
        isAuth={true}
      />
    );

    expect(screen.getByRole("button", { name: /wyczyść/i })).toBeEnabled();
  });

  it("scrolls to the main textarea when clicking Clear", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const scrollSpy = vi.fn();

    // JSDOM doesn't implement scrollIntoView; we only care that we invoke it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLElement.prototype as any).scrollIntoView = scrollSpy;

    render(
      <AnalysisForm
        text="Hello"
        onTextChange={vi.fn()}
        onSubmit={vi.fn()}
        onClear={onClear}
        isLoading={false}
        isAnalyzing={false}
        maxLength={500}
        quota={null}
        formatResetTime={() => ""}
        analysisContext=""
        onAnalysisContextChange={vi.fn()}
        isAuth={true}
      />
    );

    await user.click(screen.getByRole("button", { name: /wyczyść/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalled();
  });
});
