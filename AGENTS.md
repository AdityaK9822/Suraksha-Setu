# AGENTS.md — Suraksha Setu

Instructions for AI coding agents (OpenCode, Gemini, etc.) working in this repository.

## Project
Suraksha Setu — blockchain-based platform to securely store and verify non-government
issued documents (NBFC, etc.). Hackathon prototype focuses on Cooperative Housing
Society (CHS) documents: NOCs, builder contracts, society records.

## Tech stack
- Frontend: Vite + React 18 + TypeScript + Tailwind CSS (`frontend/`)
- Backend: Node.js + Express + TypeScript, SQLite (better-sqlite3) for prototype, Zod validation (`backend/`)
- Smart contracts: Solidity + Hardhat (TypeScript) (`contracts/`)
- Firmware (prototype): Rust via esp-rs (esp-hal) (`firmware/`) — verification kiosk implemented
- Hashing: SHA-3 (js-sha3 / @noble/hashes)
- Auth: JWT + bcrypt
- Document storage: IPFS (Pinata HTTP API)
- Package manager: npm

## Repository access & restrictions
- Repo is PRIVATE. Do not make it public or share its contents externally.
- Collaborators have write (push) access and can open PRs.
- Never push directly to `main`. Always work on a feature branch and open a PR.
  - Exception: the repo owner (Aditya) may push directly to `main`.
- No force pushes, no rewriting published history, no deleting branches without approval.
- PRs require at least one approving review before merge. Only the repo owner merges.
- Keep commits small and focused; one logical change per commit.

## Branch naming
- `feat/<short-slug>`, `fix/<short-slug>`, `docs/<short-slug>`, `chore/<short-slug>`,
  `refactor/<short-slug>`, `test/<short-slug>`.

## Workflow
- For every new issue, create a new branch from `main` before making changes.
  Branch name follows the convention above and should reference the issue, e.g.
  `feat/12-add-noc-registration` or `fix/7-hash-mismatch`.
- Never commit directly to `main`; open a PR from the issue branch.
- One issue = one branch = one PR. Close the issue via `Closes #N` in the PR body.

## Pull request format (easy to read, point-based)
Title: `<type>: <short imperative summary>` (e.g. `feat: add NOC registration contract`)

Body must include, in this order:
1. **Summary** — 1–3 sentences on what and why.
2. **Changes** — bulleted list of concrete changes (files/areas), point-based.
3. **Testing** — how it was tested (commands run, manual steps). Include output if relevant.
4. **Screenshots / recordings** — for UI changes (optional but encouraged).
5. **Related issues** — `Closes #N` / `Refs #N` if applicable.
6. **Checklist** —
   - [ ] Builds and tests pass locally
   - [ ] No secrets or API keys committed
   - [ ] Docs updated if behavior changed
   - [ ] PR is focused on one concern

Keep the PR description detailed but scannable: short bullets, no walls of text.

## Security guidelines (mandatory)
- Never commit secrets: API keys, private keys, tokens, passwords, seed phrases, RPC
  URLs with embedded keys. Use environment variables and a committed `.env.example`
  with placeholder values only.
- Add secrets to `.gitignore` (`.env`, `*.key`, `*.pem`, keystores). Never commit
  `.env` files.
- Do not log, print, or return secrets in code, tests, or error messages.
- Do not paste real keys into issues, PRs, comments, or chat; use placeholders.
- Validate and sanitize all external input (user input, on-chain data, IPFS content).
- Community documents require admin/authorized verification before being trusted.
- Hash documents with SHA-3 before storing on-chain; never store plaintext documents
  on-chain.
- Principle of least privilege: minimal permissions, minimal contract surface.
- Run dependency and secret scans before merging; keep dependencies updated.
- Report security issues privately to the repo owner — do not open public issues.

## Code style
- Follow the existing patterns in the codebase; match formatting of surrounding code.
- Add tests for new non-trivial logic.
- Prefer small, reviewable changes over large rewrites.

## What not to do
- Don't introduce new dependencies for a few lines of code.
- Don't refactor unrelated code in a feature PR.
- Don't commit generated artifacts, build output, or local config.
