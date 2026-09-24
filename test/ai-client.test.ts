import { describe, expect, it } from "vitest";
import { parseReviewResult } from "../src/ai/client.js";

describe("parseReviewResult", () => {
  it("parses a valid structured review", () => {
    const result = parseReviewResult(
      JSON.stringify({
        summary: "A validation regression is present.",
        risk: "medium",
        findings: [
          {
            severity: "medium",
            file: "src/input.ts",
            line: 18,
            title: "Empty input accepted",
            explanation: "The new condition bypasses validation.",
            suggestion: "Restore the empty-value guard."
          }
        ],
        testRecommendations: ["Add a test for an empty input."]
      })
    );

    expect(result.findings[0]?.line).toBe(18);
    expect(result.risk).toBe("medium");
  });

  it("rejects malformed output", () => {
    expect(() => parseReviewResult('{"summary":"missing fields"}')).toThrow(
      "required review schema"
    );
  });
});
