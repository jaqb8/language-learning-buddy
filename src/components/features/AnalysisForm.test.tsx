import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { AnalysisForm } from "./AnalysisForm";

describe("AnalysisForm", () => {
  it("uses a placeholder matching the selected language", () => {
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
        language="pl"
      />
    );

    expect(screen.getByPlaceholderText("Enter your Polish text here...")).toBeVisible();
  });

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
        language="en"
      />
    );

    expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
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
        language="en"
      />
    );

    const contextTrigger = screen.getByRole("button", { name: /context/i });
    expect(contextTrigger).toBeEnabled();

    await user.click(contextTrigger);

    expect(screen.getByPlaceholderText(/enter additional context/i)).toBeDisabled();
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
        language="en"
      />
    );

    expect(screen.getByRole("button", { name: /clear/i })).toBeEnabled();
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
        language="en"
      />
    );

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalled();
  });
});
