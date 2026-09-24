import type { PullRequestFile, PullRequestInput } from "../types.js";
import type { ReviewLimits } from "../config.js";

const SKIPPED_EXTENSIONS = new Set([
  ".bmp",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".lock",
  ".pdf",
  ".png",
  ".svg",
  ".webp"
]);

function extension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

function renderFile(file: PullRequestFile, maxChars: number): string | undefined {
  if (!file.patch || SKIPPED_EXTENSIONS.has(extension(file.filename))) {
    return undefined;
  }

  const patch =
    file.patch.length > maxChars
      ? `${file.patch.slice(0, maxChars)}\n... patch truncated ...`
      : file.patch;

  return [
    `FILE: ${file.filename}`,
    `STATUS: ${file.status}; +${file.additions} -${file.deletions}`,
    patch
  ].join("\n");
}

export function buildReviewInput(input: PullRequestInput, limits: ReviewLimits): string {
  const sections: string[] = [
    `PULL REQUEST: ${input.title}`,
    `BASE: ${input.baseBranch}`,
    `HEAD: ${input.headBranch}`,
    `DESCRIPTION:\n${input.body || "(no description)"}`
  ];

  let consumed = sections.join("\n\n").length;
  let included = 0;

  for (const file of input.files) {
    if (included >= limits.maxFiles) {
      break;
    }

    const rendered = renderFile(file, limits.maxFilePatchChars);
    if (!rendered) {
      continue;
    }

    if (consumed + rendered.length > limits.maxPatchChars) {
      const remaining = limits.maxPatchChars - consumed;
      if (remaining > 200) {
        sections.push(`${rendered.slice(0, remaining)}\n... review input limit reached ...`);
      }
      break;
    }

    sections.push(rendered);
    consumed += rendered.length;
    included += 1;
  }

  if (included === 0) {
    sections.push("No textual patches were available for review.");
  }

  return sections.join("\n\n");
}
