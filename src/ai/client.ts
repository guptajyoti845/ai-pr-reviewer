import type { AiConfig } from "../config.js";
import type { ReviewFinding, ReviewResult } from "../types.js";
import { SYSTEM_PROMPT } from "../review/prompt.js";

export interface AiReviewer {
  review(input: string): Promise<ReviewResult>;
}

const severities = new Set(["critical", "high", "medium", "low"]);
const risks = new Set(["high", "medium", "low"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFinding(value: unknown): ReviewFinding {
  if (!isRecord(value)) {
    throw new Error("AI response contains an invalid finding.");
  }

  const severity = value.severity;
  const file = value.file;
  const title = value.title;
  const explanation = value.explanation;
  const line = value.line;
  const suggestion = value.suggestion;

  if (
    typeof severity !== "string" ||
    !severities.has(severity) ||
    typeof file !== "string" ||
    typeof title !== "string" ||
    typeof explanation !== "string"
  ) {
    throw new Error("AI response contains a malformed finding.");
  }

  if (line !== undefined && (!Number.isInteger(line) || Number(line) <= 0)) {
    throw new Error("AI response contains an invalid line number.");
  }

  if (suggestion !== undefined && typeof suggestion !== "string") {
    throw new Error("AI response contains an invalid suggestion.");
  }

  return {
    severity: severity as ReviewFinding["severity"],
    file,
    title,
    explanation,
    ...(line === undefined ? {} : { line: Number(line) }),
    ...(suggestion === undefined ? {} : { suggestion })
  };
}

export function parseReviewResult(content: string): ReviewResult {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new Error("AI response was not valid JSON.", { cause: error });
  }

  if (!isRecord(value)) {
    throw new Error("AI response must be a JSON object.");
  }

  if (
    typeof value.summary !== "string" ||
    typeof value.risk !== "string" ||
    !risks.has(value.risk) ||
    !Array.isArray(value.findings) ||
    !Array.isArray(value.testRecommendations) ||
    !value.testRecommendations.every((item) => typeof item === "string")
  ) {
    throw new Error("AI response does not match the required review schema.");
  }

  return {
    summary: value.summary,
    risk: value.risk as ReviewResult["risk"],
    findings: value.findings.map(parseFinding),
    testRecommendations: value.testRecommendations
  };
}

export class OpenAiCompatibleReviewer implements AiReviewer {
  public constructor(private readonly config: AiConfig) {}

  public async review(input: string): Promise<ReviewResult> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: input }
        ]
      }),
      signal: AbortSignal.timeout(120_000)
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `AI request failed with ${response.status}: ${details.slice(0, 500)}`
      );
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.choices)) {
      throw new Error("AI provider returned an unexpected response.");
    }

    const firstChoice = payload.choices[0];
    if (
      !isRecord(firstChoice) ||
      !isRecord(firstChoice.message) ||
      typeof firstChoice.message.content !== "string"
    ) {
      throw new Error("AI provider returned no review content.");
    }

    return parseReviewResult(firstChoice.message.content);
  }
}
