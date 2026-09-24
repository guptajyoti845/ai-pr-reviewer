export type FindingSeverity = "critical" | "high" | "medium" | "low";

export interface ReviewFinding {
  severity: FindingSeverity;
  file: string;
  line?: number;
  title: string;
  explanation: string;
  suggestion?: string;
}

export interface ReviewResult {
  summary: string;
  risk: "high" | "medium" | "low";
  findings: ReviewFinding[];
  testRecommendations: string[];
}

export interface PullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface PullRequestInput {
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  files: PullRequestFile[];
}
