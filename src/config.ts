export interface ReviewLimits {
  maxFiles: number;
  maxPatchChars: number;
  maxFilePatchChars: number;
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_LIMITS: ReviewLimits = {
  maxFiles: 30,
  maxPatchChars: 60_000,
  maxFilePatchChars: 8_000
};

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

export function loadReviewLimits(env: NodeJS.ProcessEnv = process.env): ReviewLimits {
  return {
    maxFiles: positiveInteger(env.MAX_FILES, DEFAULT_LIMITS.maxFiles, "MAX_FILES"),
    maxPatchChars: positiveInteger(
      env.MAX_PATCH_CHARS,
      DEFAULT_LIMITS.maxPatchChars,
      "MAX_PATCH_CHARS"
    ),
    maxFilePatchChars: positiveInteger(
      env.MAX_FILE_PATCH_CHARS,
      DEFAULT_LIMITS.maxFilePatchChars,
      "MAX_FILE_PATCH_CHARS"
    )
  };
}

export function loadAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const baseUrl = env.AI_BASE_URL?.trim();
  const apiKey = env.AI_API_KEY?.trim();
  const model = env.AI_MODEL?.trim();

  const missing = [
    !baseUrl && "AI_BASE_URL",
    !apiKey && "AI_API_KEY",
    !model && "AI_MODEL"
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing required AI configuration: ${missing.join(", ")}.`);
  }

  return {
    baseUrl: baseUrl!.replace(/\/+$/, ""),
    apiKey: apiKey!,
    model: model!
  };
}
