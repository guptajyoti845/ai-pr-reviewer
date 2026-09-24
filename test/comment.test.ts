import { describe, expect, it } from "vitest";
import { COMMENT_MARKER, renderReviewComment } from "../src/github/comment.js";

describe("renderReviewComment", () => {
  it("renders findings and the stable marker", () => {
    const comment = renderReviewComment({
      summary: "One issue found.",
      risk: "high",
      findings: [
        {
          severity: "high",
          file: "src/auth.ts",
          line: 42,
          title: "Authorization bypass",
          explanation: "The new branch skips the role check.",
          suggestion: "Apply the role check before returning."
        }
      ],
      testRecommendations: ["Test a user without the required role."]
    });

    expect(comment).toContain(COMMENT_MARKER);
    expect(comment).toContain("src/auth.ts:42");
    expect(comment).toContain("Authorization bypass");
  });
});
