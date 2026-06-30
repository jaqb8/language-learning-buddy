import type { TextAnalysisDto, AnalysisLanguage, AnalysisMode } from "../../../types";
import { DEFAULT_APP_LOCALE, type AppLocale } from "@/lib/i18n";

export const correctTextMock: TextAnalysisDto = {
  is_correct: true,
  gamification_result: "correct",
  original_text: "I am a student.",
  translation: "Jestem studentem.",
};

export const incorrectTextMock: TextAnalysisDto = {
  is_correct: false,
  gamification_result: "incorrect",
  original_text: "I is a student. He go to school.",
  corrected_text: "I am a student. He goes to school.",
  explanation: "Use 'am' with 'I'. Use 'goes' for third-person singular.",
  translation: "Jestem studentem. On chodzi do szkoły.",
};

export const verbTenseErrorMock: TextAnalysisDto = {
  is_correct: false,
  gamification_result: "incorrect",
  original_text: "She don't like apples.",
  corrected_text: "She doesn't like apples.",
  explanation: "Use 'doesn't' for third-person singular in negative present simple.",
  translation: "Ona nie lubi jabłek.",
};

export const articleErrorMock: TextAnalysisDto = {
  is_correct: false,
  gamification_result: "incorrect",
  original_text: "I saw a apple on table.",
  corrected_text: "I saw an apple on the table.",
  explanation: "Use 'an' before vowel sounds. Add 'the' before specific nouns.",
  translation: "Widziałem jabłko na stole.",
};

export const formalTextMock: TextAnalysisDto = {
  is_correct: false,
  gamification_result: "incorrect",
  original_text: "I request that you provide assistance.",
  corrected_text: "Could you help me?",
  explanation:
    "The original text is grammatically correct but sounds overly formal. A more natural, colloquial way to ask for help would be 'Could you help me?' or 'Can you help me out?'",
  translation: "Czy możesz mi pomóc?",
};

export const unnaturalPhrasingMock: TextAnalysisDto = {
  is_correct: false,
  gamification_result: "incorrect",
  original_text: "I am going to proceed to the location of employment.",
  corrected_text: "I'm heading to work.",
  explanation:
    "While grammatically correct, this sounds unnatural and overly formal. Native speakers would say 'I'm heading to work' or 'I'm going to work' in casual conversation.",
  translation: "Idę do pracy.",
};

export const naturalColloquialTextMock: TextAnalysisDto = {
  is_correct: true,
  gamification_result: "correct",
  original_text: "Hey, what's up? Want to grab some coffee?",
  translation: "Hej, co słychać? Chcesz napić się kawy?",
};

export const polishGrammarErrorMock: TextAnalysisDto = {
  is_correct: false,
  gamification_result: "incorrect",
  original_text: "Ja lubić czytać książki.",
  corrected_text: "Lubię czytać książki.",
  explanation: "The verb must be conjugated in the **first-person singular**: _**lubię**_.",
  translation: "I like reading books.",
};

export const polishColloquialErrorMock: TextAnalysisDto = {
  is_correct: false,
  gamification_result: "incorrect",
  original_text: "Uprzejmie proszę o udzielenie mi pomocy.",
  corrected_text: "Możesz mi pomóc?",
  explanation: "In everyday conversation, the shorter question sounds more **natural and direct**.",
  translation: "Can you help me?",
};

const POLISH_EXPLANATIONS: Record<string, string> = {
  [incorrectTextMock.corrected_text]:
    "Z _**I**_ użyj formy _**am**_. W trzeciej osobie liczby pojedynczej czasownik przyjmuje formę _**goes**_.",
  [verbTenseErrorMock.corrected_text]:
    "W przeczeniu czasu **Present Simple** dla trzeciej osoby liczby pojedynczej użyj _**doesn't**_.",
  [articleErrorMock.corrected_text]:
    "Przed samogłoską użyj rodzajnika _**an**_, a przed konkretnym rzeczownikiem rodzajnika _**the**_.",
  [formalTextMock.corrected_text]:
    "Krótsze pytanie brzmi bardziej **naturalnie i potocznie** niż formalna konstrukcja z _**request**_.",
  [unnaturalPhrasingMock.corrected_text]:
    "Konstrukcja _**head to work**_ brzmi w codziennej rozmowie bardziej **naturalnie i zwięźle**.",
  [polishGrammarErrorMock.corrected_text]:
    "Czasownik należy odmienić w **pierwszej osobie liczby pojedynczej**: _**lubię**_.",
  [polishColloquialErrorMock.corrected_text]:
    "W codziennej rozmowie krótsze pytanie brzmi bardziej **naturalnie i bezpośrednio**.",
};

function localizeMockExplanation(result: TextAnalysisDto, locale: AppLocale): TextAnalysisDto {
  if (result.is_correct || locale === "en") {
    return result;
  }

  return {
    ...result,
    explanation: POLISH_EXPLANATIONS[result.corrected_text] ?? result.explanation,
  };
}

export function getMockAnalysis(
  text: string,
  mode: AnalysisMode,
  language: AnalysisLanguage,
  explanationLocale: AppLocale = DEFAULT_APP_LOCALE
): TextAnalysisDto {
  const lowerText = text.toLowerCase().trim();

  if (language === "pl") {
    if (mode === "grammar_and_spelling" && (lowerText.includes("ja lubić") || lowerText.includes("on lubić"))) {
      return localizeMockExplanation(
        {
          ...polishGrammarErrorMock,
          original_text: text,
        },
        explanationLocale
      );
    }

    if (mode === "colloquial_speech" && lowerText.includes("uprzejmie proszę o udzielenie")) {
      return localizeMockExplanation(
        {
          ...polishColloquialErrorMock,
          original_text: text,
        },
        explanationLocale
      );
    }

    return {
      is_correct: true,
      gamification_result: "correct",
      original_text: text,
      translation: null,
    };
  }

  if (mode === "grammar_and_spelling") {
    if (lowerText.includes("i is") || lowerText.includes("he go")) {
      return localizeMockExplanation(
        {
          ...incorrectTextMock,
          original_text: text,
        },
        explanationLocale
      );
    }

    if (lowerText.includes("don't") && (lowerText.includes("she") || lowerText.includes("he"))) {
      return localizeMockExplanation(
        {
          ...verbTenseErrorMock,
          original_text: text,
        },
        explanationLocale
      );
    }

    if (lowerText.includes("a apple") || lowerText.includes("on table")) {
      return localizeMockExplanation(
        {
          ...articleErrorMock,
          original_text: text,
        },
        explanationLocale
      );
    }

    return {
      is_correct: true,
      gamification_result: "correct",
      original_text: text,
      translation: null,
    };
  }

  if (mode === "colloquial_speech") {
    if (lowerText.includes("request that you provide assistance")) {
      return localizeMockExplanation(
        {
          ...formalTextMock,
          original_text: text,
        },
        explanationLocale
      );
    }

    if (lowerText.includes("proceed to the location")) {
      return localizeMockExplanation(
        {
          ...unnaturalPhrasingMock,
          original_text: text,
        },
        explanationLocale
      );
    }

    if (lowerText.includes("what's up") || lowerText.includes("grab some coffee")) {
      return {
        ...naturalColloquialTextMock,
        original_text: text,
      };
    }

    return {
      is_correct: true,
      gamification_result: "correct",
      original_text: text,
      translation: null,
    };
  }

  return {
    is_correct: true,
    gamification_result: "correct",
    original_text: text,
    translation: null,
  };
}
