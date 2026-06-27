# Repository Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unsafe automation, prevent secret publication, and enforce verified changes on the public repository.

**Architecture:** Keep handover data-only, make installation fail closed around user-owned paths, and use one redacting secret scanner from both `/debrief` and CI. GitHub-native secret scanning and protected-branch checks provide the remote enforcement layer.

**Tech Stack:** Node.js built-ins, Python `unittest`, Git, GitHub Actions, GitHub REST API.

## Global Constraints

- Do not rewrite Git history or force-push.
- Do not print matched secret values.
- Do not delete or overwrite pre-existing user skill directories.
- Do not publish a new npm version in this task.
- Preserve the existing manual `/clear` then `/continue` handover workflow.

---

### Task 1: Add Security Regression Tests

**Files:**
- Create: `tests/security-hardening.test.mjs`
- Create: `tests/test_handover_security.py`

**Interfaces:**
- Consumes: `scripts/link-skills.mjs`, `skills/debrief/scan-secrets.mjs`, `skills/handover/`
- Produces: repeatable regression coverage for the three reviewed vulnerabilities

- [ ] **Step 1: Write failing tests** for non-destructive linking, staged secret rejection with redacted output, harmless staged content, and absence of handover launchers or automatic-task instructions.
- [ ] **Step 2: Run `node --test tests/security-hardening.test.mjs` and `python -m unittest tests.test_handover_security -v`.**
  Expected: failures showing the destructive linker, missing scanner, and existing launcher files.

### Task 2: Make Linking Non-Destructive

**Files:**
- Modify: `scripts/link-skills.mjs`

**Interfaces:**
- Consumes: optional `CLAUDE_SKILLS_DIR`
- Produces: links only when the target is absent; skips user-owned targets

- [ ] **Step 1: Add `CLAUDE_SKILLS_DIR` override and remove recursive deletion.**
- [ ] **Step 2: Run `node --test tests/security-hardening.test.mjs`.**
  Expected: linker regression passes while scanner tests still fail until Task 3.

### Task 3: Add the Secret Gate

**Files:**
- Create: `skills/debrief/scan-secrets.mjs`
- Modify: `skills/debrief/SKILL.md`
- Modify: `skills/debrief/behavioral-eval.md`

**Interfaces:**
- Consumes: `--staged` (default) or `--all`
- Produces: exit `0` for clean content and exit `1` with redacted path/rule findings for blocked content

- [ ] **Step 1: Implement staged and tracked-file collection using Git commands without a shell.**
- [ ] **Step 2: Implement filename, token, assignment, private-key, credential-URL, and entropy rules with `secret-scan: allow`.**
- [ ] **Step 3: Require the staged scan immediately before both debrief commits.**
- [ ] **Step 4: Run the Node regression tests.**
  Expected: all Node tests pass.

### Task 4: Remove Unsafe Handover Automation and Public Metadata

**Files:**
- Delete: `skills/handover/handover_send.py`
- Delete: `skills/handover/handover_continue.py`
- Modify: `skills/handover/handover.md`
- Modify: `skills/handover/handover.html`
- Modify: `skills/handover/SKILL.md`

**Interfaces:**
- Produces: a data-only handover skill with no process or editor-task execution

- [ ] **Step 1: Remove both launchers and all stale launch instructions.**
- [ ] **Step 2: Replace hard-coded paths and workflow IDs with generic examples.**
- [ ] **Step 3: Run `python -m unittest tests.test_handover_security -v`.**
  Expected: all handover security tests pass.

### Task 5: Add CI and Package Checks

**Files:**
- Create: `.github/workflows/security.yml`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: `npm test`, `npm run security`, and `npm run check`

- [ ] **Step 1: Add pinned checkout, Node, and Python actions.**
- [ ] **Step 2: Add package scripts for tests, full-tree secret scanning, and the complete check suite.**
- [ ] **Step 3: Run `npm run check` and `npm pack --dry-run --json`.**
  Expected: checks pass and only intended package files ship.

### Task 6: Publish and Enforce Remote Controls

**Files:**
- Modify: repository-local Git configuration only for author email

**Interfaces:**
- Produces: pushed remediation commit and protected `master`

- [ ] **Step 1: Run Semgrep, the historical secret scan, and inspect the complete diff.**
- [ ] **Step 2: Set the repository-local author email to GitHub noreply, stage explicit paths, and commit.**
- [ ] **Step 3: Push `master`, wait for the Security workflow, and verify its check name.**
- [ ] **Step 4: Enable secret scanning, push protection, vulnerability alerts, automated security fixes, and administrator-enforced required status checks.**
- [ ] **Step 5: Re-read all GitHub security settings and verify `master` equals the local commit.**

