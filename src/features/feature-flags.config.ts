export type Feature = "auth" | "learning-items" | "gamification";
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
  },
  integration: {
    auth: { enabled: true },
    "learning-items": { enabled: true },
    gamification: { enabled: true, beta: false },
  },
  production: {
    auth: { enabled: true },
    "learning-items": { enabled: true },
    gamification: { enabled: true, beta: false },
  },
};

export default featureFlagsConfig;
