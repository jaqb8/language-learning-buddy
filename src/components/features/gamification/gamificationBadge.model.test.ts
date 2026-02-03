import { describe, it, expect } from "vitest";
import { buildGamificationBadgeVM, getLevelFromPercentage } from "./gamificationBadge.model";

describe("gamificationBadge.model", () => {
  describe("getLevelFromPercentage", () => {
    it("should map threshold ranges to correct levels", () => {
      expect(getLevelFromPercentage(0)).toBe("beginner");
      expect(getLevelFromPercentage(39)).toBe("beginner");
      expect(getLevelFromPercentage(40)).toBe("developing");
      expect(getLevelFromPercentage(69)).toBe("developing");
      expect(getLevelFromPercentage(70)).toBe("advanced");
      expect(getLevelFromPercentage(89)).toBe("advanced");
      expect(getLevelFromPercentage(90)).toBe("expert");
      expect(getLevelFromPercentage(100)).toBe("expert");
    });
  });

  describe("buildGamificationBadgeVM", () => {
    it("should return null when stats are missing", () => {
      expect(buildGamificationBadgeVM({ correctAnalyses: undefined, totalAnalyses: 1 })).toBeNull();
      expect(buildGamificationBadgeVM({ correctAnalyses: 1, totalAnalyses: undefined })).toBeNull();
    });

    it("should compute a 0% beginner VM when there are no analyses", () => {
      const vm = buildGamificationBadgeVM({ correctAnalyses: 0, totalAnalyses: 0, showBeta: true });
      expect(vm).not.toBeNull();
      expect(vm?.percentage).toBe(0);
      expect(vm?.levelKey).toBe("beginner");
      expect(vm?.hasAnalyses).toBe(false);
      expect(vm?.showBeta).toBe(true);
    });

    it("should select correct levels at acceptance thresholds", () => {
      expect(buildGamificationBadgeVM({ correctAnalyses: 39, totalAnalyses: 100 })?.levelKey).toBe("beginner");
      expect(buildGamificationBadgeVM({ correctAnalyses: 40, totalAnalyses: 100 })?.levelKey).toBe("developing");
      expect(buildGamificationBadgeVM({ correctAnalyses: 69, totalAnalyses: 100 })?.levelKey).toBe("developing");
      expect(buildGamificationBadgeVM({ correctAnalyses: 70, totalAnalyses: 100 })?.levelKey).toBe("advanced");
      expect(buildGamificationBadgeVM({ correctAnalyses: 89, totalAnalyses: 100 })?.levelKey).toBe("advanced");
      expect(buildGamificationBadgeVM({ correctAnalyses: 90, totalAnalyses: 100 })?.levelKey).toBe("expert");
    });
  });
});
