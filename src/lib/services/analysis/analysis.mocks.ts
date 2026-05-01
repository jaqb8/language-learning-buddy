import type { TextAnalysisDto, AnalysisMode } from "../../../types";

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

export function getMockAnalysis(text: string, mode: AnalysisMode): TextAnalysisDto {
  const lowerText = text.toLowerCase().trim();

  if (mode === "grammar_and_spelling") {
    if (lowerText.includes("i is") || lowerText.includes("he go")) {
      return {
        ...incorrectTextMock,
        original_text: text,
      };
    }

    if (lowerText.includes("don't") && (lowerText.includes("she") || lowerText.includes("he"))) {
      return {
        ...verbTenseErrorMock,
        original_text: text,
      };
    }

    if (lowerText.includes("a apple") || lowerText.includes("on table")) {
      return {
        ...articleErrorMock,
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

  if (mode === "colloquial_speech") {
    if (lowerText.includes("request that you provide assistance")) {
      return {
        ...formalTextMock,
        original_text: text,
      };
    }

    if (lowerText.includes("proceed to the location")) {
      return {
        ...unnaturalPhrasingMock,
        original_text: text,
      };
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
