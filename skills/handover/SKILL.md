---
name: handover
description: Use when the user types /handover, or wants to hand the current session's work off to a fresh Claude session to continue it — i.e. curate a dense continuation prompt (goal, decisions, state, files, next step) and carry it into a new session rather than dumping a raw transcript. Not for casual "summarize what we did" recaps, and not for resuming an existing session (that's /continue).
argument-hint: "What the next session should focus on (optional)"
---

# Handover -> Fresh Session

## Overview

Curate the current session into a tight, dense handover **prompt** (not a transcript),
save it where `/continue` already ingests it (`./.ccb/history/`, newest-wins), then tell the
user the two-step move to continue in a fresh session.

This is the *generate* half. `/continue` is the *ingest* half (it attaches the newest
`./.ccb/history/*.md` via `@file`); this skill reuses it untouched. `ctx-transfer` is NOT
used here — it dumps raw transcript; a handover is a curated next-steps prompt.

## Step 1 — Compose the handover doc

Write Markdown with the sections below. Scale each to the work; drop a section only if it is
genuinely empty. Keep it dense — the next agent reads this cold, with none of your context.
Gather state from tools (git status, recent commits, todos, files touched) rather than asking.

- **Goal** — what we're trying to achieve (1–3 lines). If an argument was passed to the skill,
  tailor the whole doc toward that focus.
- **Status** — where things stand now: done, in-flight, blocked. State as facts, not commands.
- **Key decisions (+ why)** — choices made and the reasoning, so the next session doesn't relitigate them.
- **Failed approaches / don't repeat** — dead ends already tried, so they are not retried.
- **Relevant files** — paths with line ranges where useful. Reference existing artifacts
  (specs, plans, commits, diffs, issues) by path/URL — do **not** duplicate their content.
- **Next step** — the single concrete next action to take.
- **Don't do** — anti-loop guard: rabbit holes / actions the next session should avoid.
- **Suggested skills** — skills the next session should invoke (e.g. `systematic-debugging`,
  the project's `recon`).

Rules: redact secrets (API keys, tokens, PII). No raw conversation logs. Dense over complete.

## Step 2 — Save it (MANDATORY, atomic)

Compute the target path and ensure the directory exists:

```bash
mkdir -p "$PWD/.ccb/history" && echo "TARGET: $(pwd -W)/.ccb/history/claude-$(date -u +%Y%m%d-%H%M%S)-handover.md"
```

Then write the composed doc to that exact `TARGET` path using the **Write tool**.
Write the file before any reset — never reset first (atomic-save discipline).

## Step 3 — Report the reliable next move (MANDATORY)

For security, this skill does not create editor tasks or launch processes. After the brief is
written, print the saved path and the two-step move, verbatim:

> Brief saved: `<TARGET>`
>
> **Reliable move — in this terminal:**
> 1. `/clear`
> 2. `/continue`

`/continue` attaches the newest `./.ccb/history/*.md` (the brief just written) via `@file`, so the
fresh session resumes with full context. The current session stays intact until the user clears it.

If the user instead wants a **separate** window (keeping this session open), give them the brief
path to paste into any fresh `claude`: `@<TARGET>`.

## Output

Report the saved brief path and the reliable two-step move: `/clear`, then `/continue`.
