import { readFile } from "node:fs/promises";
import { OpenAiCompatibleReviewer } from "./ai/client.js";
import { loadAiConfig } from "./config.js";
import { renderReviewComment } from "./github/comment.js";

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) {
    throw new Error("Usage: npm run review -- <diff-file>");
  }

  const diff = await readFile(path, "utf8");
  if (!diff.trim()) {
    throw new Error(`Diff file is empty: ${path}`);
  }

  const reviewer = new OpenAiCompatibleReviewer(loadAiConfig());
  const result = await reviewer.review(
    `Review this local diff. File names and patches follow:\n\n${diff}`
  );
  process.stdout.write(`${renderReviewComment(result)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Review failed: ${message}\n`);
  process.exitCode = 1;
});
