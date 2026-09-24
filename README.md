# AI PR Reviewer

A GitHub App that reviews pull-request diffs for correctness, security risks, regressions,
and missing tests. It posts one structured comment per pull request and updates that comment
when new commits are pushed.

## Features

- Reviews opened, reopened, synchronized, and ready-for-review pull requests
- Skips draft pull requests and binary or generated-looking assets
- Caps file count and patch size to control cost
- Requires structured JSON from the model and validates it before posting
- Reuses a hidden marker to avoid creating duplicate review comments
- Supports any OpenAI-compatible chat-completions endpoint
- Includes a local diff-review command

## Quick start

Requirements: Node.js 20 or newer and a GitHub App.

```powershell
npm install
Copy-Item .env.example .env
```

Configure the GitHub App:

1. Set **Repository permissions**:
   - Pull requests: **Read**
   - Issues: **Read and write**
   - Metadata: **Read**
2. Subscribe to **Pull request** events.
3. Set the webhook URL to the public URL printed by Probot during local development.
4. Download the app private key and update `.env`.

Configure the model endpoint in `.env`:

```dotenv
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-key
AI_MODEL=your-model
```

Start the app:

```powershell
npm run dev
```

## Local review

Create a diff and send it through the same reviewer:

```powershell
git diff origin/main...HEAD | Set-Content change.diff
npm run review -- change.diff
```

The command prints the Markdown review without posting to GitHub.

## Configuration

| Variable | Required | Default | Purpose |
|---|---:|---:|---|
| `APP_ID` | Yes | — | GitHub App ID |
| `PRIVATE_KEY_PATH` | Yes | — | Path to the GitHub App private key |
| `WEBHOOK_SECRET` | Yes | — | Webhook signature secret |
| `AI_BASE_URL` | Yes | — | OpenAI-compatible API base URL |
| `AI_API_KEY` | Yes | — | Model API credential |
| `AI_MODEL` | Yes | — | Provider model identifier |
| `MAX_FILES` | No | `30` | Maximum textual files reviewed |
| `MAX_PATCH_CHARS` | No | `60000` | Total review-input character limit |
| `MAX_FILE_PATCH_CHARS` | No | `8000` | Per-file patch character limit |

## Security notes

Pull-request content is untrusted. The system prompt explicitly separates review data from
instructions, but prompt injection cannot be eliminated entirely. Use a dedicated,
least-privileged model credential, keep GitHub App permissions minimal, and validate every
finding before applying a suggested change.

Fork pull requests may contain sensitive or adversarial content. Do not add repository secrets
to pull-request workflows; this app processes webhooks in its own trusted service instead.
