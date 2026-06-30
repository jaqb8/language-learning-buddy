interface LanguageFlagProps {
  language: "en" | "pl";
}

export function LanguageFlag({ language }: LanguageFlagProps) {
  const commonProps = {
    className: "h-4 w-6 shrink-0 overflow-hidden rounded-[4px] shadow-sm",
    "aria-hidden": true,
    "data-testid": `language-flag-${language}`,
    viewBox: "0 0 24 16",
  } as const;

  if (language === "pl") {
    return (
      <svg {...commonProps}>
        <rect width="24" height="8" fill="#fff" />
        <rect y="8" width="24" height="8" fill="#dc143c" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <rect width="24" height="16" fill="#21468b" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#cf142b" strokeWidth="2" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#cf142b" strokeWidth="3" />
    </svg>
  );
}
