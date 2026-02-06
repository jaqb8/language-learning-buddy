import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { __setEnv, __resetEnv } from "../test/mocks/astro-env-client";
import { isFeatureEnabled, isFeatureBeta } from "./feature-flags.service";
import featureFlagsConfig from "./feature-flags.config";

describe("feature-flags.service", () => {
  beforeEach(() => {
    __resetEnv();
  });

  afterEach(() => {
    __resetEnv();
  });

  describe("isFeatureEnabled", () => {
    describe("configuration reading", () => {
      it("should read feature flag from config for 'local' environment", () => {
        __setEnv("local");
        const authEnabled = isFeatureEnabled("auth");
        expect(authEnabled).toBe(featureFlagsConfig.local.auth.enabled);
      });

      it("should read feature flag from config for 'integration' environment", () => {
        __setEnv("integration");
        const authEnabled = isFeatureEnabled("auth");
        expect(authEnabled).toBe(featureFlagsConfig.integration.auth.enabled);
      });

      it("should read feature flag from config for 'production' environment", () => {
        __setEnv("production");
        const authEnabled = isFeatureEnabled("auth");
        expect(authEnabled).toBe(featureFlagsConfig.production.auth.enabled);
      });

      it("should handle all defined features", () => {
        __setEnv("local");
        const authEnabled = isFeatureEnabled("auth");
        const learningItemsEnabled = isFeatureEnabled("learning-items");
        const gamificationEnabled = isFeatureEnabled("gamification");
        const analysisModesBetaEnabled = isFeatureEnabled("analysis-modes-beta");

        expect(authEnabled).toBe(featureFlagsConfig.local.auth.enabled);
        expect(learningItemsEnabled).toBe(featureFlagsConfig.local["learning-items"].enabled);
        expect(gamificationEnabled).toBe(featureFlagsConfig.local.gamification.enabled);
        expect(analysisModesBetaEnabled).toBe(featureFlagsConfig.local["analysis-modes-beta"].enabled);
      });
    });

    describe("environment fallback", () => {
      it("should default to 'production' when environment is invalid", () => {
        __setEnv("invalid-env");
        const authEnabled = isFeatureEnabled("auth");
        expect(authEnabled).toBe(featureFlagsConfig.production.auth.enabled);
      });

      it("should default to 'production' when environment is not set", () => {
        __resetEnv();
        const authEnabled = isFeatureEnabled("auth");
        expect(authEnabled).toBe(featureFlagsConfig.production.auth.enabled);
      });

      it("should default to 'production' when environment is empty string", () => {
        __setEnv("");
        const authEnabled = isFeatureEnabled("auth");
        expect(authEnabled).toBe(featureFlagsConfig.production.auth.enabled);
      });
    });

    describe("error handling", () => {
      it("should return false when environment config is missing", () => {
        __setEnv("production");
        vi.spyOn(featureFlagsConfig, "production", "get").mockReturnValue(undefined as never);

        const result = isFeatureEnabled("auth");
        expect(result).toBe(false);

        vi.restoreAllMocks();
      });

      it("should return false when feature is not defined in config", () => {
        __setEnv("local");
        const config = { ...featureFlagsConfig.local };
        delete (config as Record<string, unknown>).auth;
        vi.spyOn(featureFlagsConfig, "local", "get").mockReturnValue(config as typeof featureFlagsConfig.local);

        const result = isFeatureEnabled("auth");
        expect(result).toBe(false);

        vi.restoreAllMocks();
      });
    });
  });

  describe("isFeatureBeta", () => {
    describe("configuration reading", () => {
      it("should return true for features marked as beta", () => {
        __setEnv("local");
        const betaModesBeta = isFeatureBeta("analysis-modes-beta");
        expect(betaModesBeta).toBe(featureFlagsConfig.local["analysis-modes-beta"].beta);
      });

      it("should return false for features not marked as beta", () => {
        __setEnv("local");
        const authBeta = isFeatureBeta("auth");
        expect(authBeta).toBe(false);
      });

      it("should work across different environments", () => {
        __setEnv("production");
        const betaModesBeta = isFeatureBeta("analysis-modes-beta");
        expect(betaModesBeta).toBe(featureFlagsConfig.production["analysis-modes-beta"].beta);
      });
    });

    describe("error handling", () => {
      it("should return false when environment config is missing", () => {
        __setEnv("production");
        vi.spyOn(featureFlagsConfig, "production", "get").mockReturnValue(undefined as never);

        const result = isFeatureBeta("analysis-modes-beta");
        expect(result).toBe(false);

        vi.restoreAllMocks();
      });

      it("should return false when feature is not defined in config", () => {
        __setEnv("local");
        const config = { ...featureFlagsConfig.local };
        delete (config as Record<string, unknown>)["analysis-modes-beta"];
        vi.spyOn(featureFlagsConfig, "local", "get").mockReturnValue(config as typeof featureFlagsConfig.local);

        const result = isFeatureBeta("analysis-modes-beta");
        expect(result).toBe(false);

        vi.restoreAllMocks();
      });
    });
  });
});
