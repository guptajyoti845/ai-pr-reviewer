import type { Probot } from "probot";
import { OpenAiCompatibleReviewer } from "./ai/client.js";
import { loadAiConfig, loadReviewLimits } from "./config.js";
import { COMMENT_MARKER, renderReviewComment } from "./github/comment.js";
import { buildReviewInput } from "./review/diff.js";
import type { PullRequestFile } from "./types.js";

export default (app: Probot): void => {
  app.on(
    [
      "pull_request.opened",
      "pull_request.reopened",
      "pull_request.synchronize",
      "pull_request.ready_for_review"
    ],
    async (context) => {
    const pullRequest = context.payload.pull_request;
    if (pullRequest.draft) {
      context.log.info("Skipping draft pull request.");
      return;
    }

    const files: PullRequestFile[] = await context.octokit.paginate(
      context.octokit.rest.pulls.listFiles,
      context.pullRequest({ per_page: 100 }),
      (response) =>
        response.data.map((file) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          ...(file.patch ? { patch: file.patch } : {})
        }))
    );

    const reviewInput = buildReviewInput(
      {
        title: pullRequest.title,
        body: pullRequest.body ?? "",
        baseBranch: pullRequest.base.ref,
        headBranch: pullRequest.head.ref,
        files
      },
      loadReviewLimits()
    );

    const reviewer = new OpenAiCompatibleReviewer(loadAiConfig());
    const result = await reviewer.review(reviewInput);
    const body = renderReviewComment(result);

    const comments = await context.octokit.paginate(
      context.octokit.rest.issues.listComments,
      context.issue({ per_page: 100 })
    );
    const existing = comments.find(
      (comment) =>
        comment.user?.type === "Bot" && comment.body?.includes(COMMENT_MARKER)
    );

    if (existing) {
      await context.octokit.rest.issues.updateComment({
        ...context.repo(),
        comment_id: existing.id,
        body
      });
    } else {
      await context.octokit.rest.issues.createComment(context.issue({ body }));
    }
    }
  );
};
