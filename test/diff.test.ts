import { describe, expect, it } from "vitest";
import { buildReviewInput } from "../src/review/diff.js";

describe("buildReviewInput", () => {
  it("includes textual patches and skips binary assets", () => {
    const result = buildReviewInput(
      {
        title: "Fix validation",
        body: "Reject empty values",
        baseBranch: "main",
        headBranch: "fix",
        files: [
          {
            filename: "src/validate.ts",
            status: "modified",
            additions: 1,
            deletions: 1,
            patch: "@@ -1 +1 @@\n-old\n+new"
          },
          {
            filename: "logo.png",
            status: "added",
            additions: 0,
            deletions: 0,
            patch: "binary"
          }
        ]
      },
      { maxFiles: 10, maxPatchChars: 10_000, maxFilePatchChars: 1_000 }
    );

    expect(result).toContain("src/validate.ts");
    expect(result).toContain("+new");
    expect(result).not.toContain("logo.png");
  });

  it("truncates oversized file patches", () => {
    const result = buildReviewInput(
      {
        title: "Large change",
        body: "",
        baseBranch: "main",
        headBranch: "feature",
        files: [
          {
            filename: "large.ts",
            status: "modified",
            additions: 100,
            deletions: 0,
            patch: "x".repeat(500)
          }
        ]
      },
      { maxFiles: 10, maxPatchChars: 2_000, maxFilePatchChars: 100 }
    );

    expect(result).toContain("patch truncated");
    expect(result.length).toBeLessThan(1_000);
  });
});
