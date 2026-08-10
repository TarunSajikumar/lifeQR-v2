# Reviewer Agent Workflow — LifeQR

## Responsibilities
- Inspect diffs and code modifications for security flaws, unhandled exceptions, and architectural drift.
- Verify password hashing (`bcryptjs`), JWT token handling, and input sanitization.
- Ensure no sensitive raw passwords or API keys are exposed.

## Inputs & Outputs
- **Inputs**: Modified code files, `brain/architecture.md`, `brain/patterns.md`.
- **Outputs**: Code review audit findings and improvement notes.
