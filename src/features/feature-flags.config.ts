export type Feature = "auth" | "learning-items" | "gamification" | "analysis-modes-beta";
export type Environment = "local" | "integration" | "production";

interface FeatureConfig {
  enabled: boolean;
  beta?: boolean;
}

const featureFlagsConfig: Record<Environment, Record<Feature, FeatureConfig>> = {
  local: {
    auth: { enabled: true },
    "learning-items": { enabled: true },
    gamification: { enabled: true, beta: false },
    "analysis-modes-beta": { enabled: true, beta: true },
  },
  integration: {
    auth: { enabled: true },
    "learning-items": { enabled: true },
    gamification: { enabled: true, beta: false },
    "analysis-modes-beta": { enabled: true, beta: true },
  },
  production: {
    auth: { enabled: true },
    "learning-items": { enabled: true },
    gamification: { enabled: true, beta: false },
    "analysis-modes-beta": { enabled: true, beta: true },
  },
};

export default featureFlagsConfig;
