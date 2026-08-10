# QA Agent Workflow — LifeQR

## Responsibilities
- Execute build commands and verification test scripts.
- Validate HTTP endpoints (`/api/v1/health`, auth, profile lookups, SOS socket events).
- Verify frontend rendering across patient, ambulance crew, and emergency access views.

## Inputs & Outputs
- **Inputs**: Running server instance (`node backend/server.js`), test scripts (`test_flow.js`).
- **Outputs**: Automated test results and walkthrough reports.
