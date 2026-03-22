---
name: debrief
description: "Use when ending a work session to clean up loose ends, capture knowledge through the 5 engineering disciplines, update documentation, and commit changes. Pairs with /recon as session bookends."
---

# Debrief

Session-end skill. Cleans up loose ends, captures knowledge through the 5 engineering disciplines, routes findings to persistence targets, and commits everything cleanly. Pairs with `/recon` — recon opens sessions, debrief closes them.

**Always runs all 6 phases in order.** Parallel tool calls within a phase are encouraged for speed.

## Phase Architecture

Phase gates are strict — complete one before starting the next.

| Phase | Name | Action |
|-------|------|--------|
| 1 | ASSESS | Scan git status, git diff, TODOs/debug output in uncommitted changes. Categorize as: **Trivial** (formatting, debug cruft, staging) · **Substantive** (failing tests, lint errors) · **Deferred** (too big for session-end). |
| 2 | TRIAGE | Trivial → auto-fix silently. Substantive → prompt user `(y/N)`, default defer. Deferred → log for next session. **Never modify logic, delete files, or alter public APIs without approval.** Present cleanup summary when done. |
| 3 | COMMIT WORK | Auto-commit user's work + triage fixes. Match repo's commit style. If pre-commit hook fails → present error, ask user. If user declines → proceed with uncommitted changes, note in report. **Guard:** if last commit starts with `debrief:`, skip Phases 1-3. |
| 4 | DISCIPLINE AUDIT | Single pass across 5 disciplines + enhancement lenses. See below. |
| 5 | ROUTE KNOWLEDGE | Write findings to correct targets. See routing table below. |
| 6 | COMMIT & REPORT | Auto-commit debrief's doc/memory changes. Output terse action summary. |

**Two commits total:** user's work (Phase 3), debrief's changes (Phase 6).

---

## Phase 1-2: Assess & Triage

**Checks (parallel where possible):**
- `git status` + `git diff` — uncommitted changes, untracked files
- Lint/test — only if project has a fast check (<10s). Skip slow suites.
- `TODO`/`FIXME` in `git diff` output (uncommitted only, not pre-existing)
- Debug output (`console.log`, `print()`) in `git diff` — only flag if not in logging/CLI code

**Triage rules:**

| Category | Action |
|----------|--------|
| **Trivial** | Auto-fix: format, stage tracked files, remove debug cruft |
| **Substantive** | Prompt: "Fix now? (y/N)" — default defer, execute only on explicit yes |
| **Deferred** | Log as next-session item, no action |

After triage, present cleanup summary: what was resolved, what was deferred.

---

## Phase 4: Discipline Audit

Single pass asking: "Did anything this session change how agents should operate here?"

| Discipline | Signals | Example |
|------------|---------|---------|
| **Prompt Craft** | New guardrails, output format preferences, agent instruction patterns | "Test names must use `should_X_when_Y` format" |
| **Context Engineering** | Critical files identified, missing context that caused problems, noisy context | "src/config/flags.ts is essential context for feature work" |
| **Intent Engineering** | Trade-offs decided, priorities clarified, agent boundaries set | "Optimize for read performance over write" |
| **Specification Engineering** | Acceptance criteria refined, edge cases discovered | "Empty input returns [], not null" |
| **Task Engineering** | Decomposition patterns, dependency ordering, scope lessons | "Auth and billing parallel, both block dashboard" |

### Enhancement Lenses (apply during the same pass)

1. **Cross-Category** — Chain findings across disciplines. When a finding touches one discipline, grep CLAUDE.md and memory for related entries in others.
2. **Judgment Line** — Check for session moments that clarify human/agent boundaries. Look for corrections like "don't do X automatically" or "always ask before Y."
3. **Time-Bridging** — Flag information with future relevance (3+ months). Scan for dates, deadlines, version numbers, "until," "expires." Route to memory with time context.
4. **Compounding Test** — "Will this make the next session better?" If yes, capture. If it's just a record of what happened, skip. This prevents memory bloat.
5. **Capture Consistency** — Before writing, read MEMORY.md index to check for existing entries. Tag each finding: discipline, routing target, new vs update.

**Rules:**
- Zero findings is valid. Don't force output on quiet sessions.
- Each finding must be **actionable** — not "we discussed auth" but "auth tokens rotate every 24h, not 72h."
- For large repos: parallelize file reads within this phase.

---

## Phase 5: Route Knowledge

| Target | What Goes Here | How |
|--------|---------------|-----|
| **CLAUDE.md** | Conventions, guardrails, coding patterns | Append to relevant section |
| **Memory files** | Decisions, project context, preferences, time-bridging signals | Write/update in `~/.claude/projects/.../memory/`, update MEMORY.md. Use frontmatter: `name`, `description`, `type` (user/feedback/project/reference) |
| **Todo** | Deferred loose ends, large work items | Append to project's existing todo file. Don't create orphan files. |
| **Existing docs** | Corrections filling gaps or fixing contradictions | Edit in place |

**Rules:** Update over create. Minimal edits — append, don't restructure. No duplicates — read before writing. **Priority:** memory files over CLAUDE.md when either could work.

---

## Phase 6: Commit & Report

**Commit** debrief's doc/memory changes (triage fixes already committed in Phase 3):

```
debrief: session wrap-up

Knowledge captured:
- [updates with discipline tags]

Deferred:
- [next-session items]
```

**Report** — terse, adaptive. Omit empty sections:

```
SESSION CONTEXT
- [2-3 bullets of what the session was about]

DEBRIEF ACTIONS
Loose ends resolved:
- [triage actions]

Knowledge routed:
- [file: description [Discipline]]

Deferred to next session:
- [items]

Commits:
- [hash] "message" (user work)
- [hash] "message" (debrief updates)
```

Light sessions shrink to 3-4 lines.

---

## Common Mistakes

| Mistake | Correction |
|---------|-----------|
| Rehashing the session | Lead with debrief's actions. Session context is 2-3 bullets max. |
| Capturing obvious things | Compounding test: "Will this make the next session better?" |
| Bloating CLAUDE.md | Append lines, don't restructure. Prefer memory files if CLAUDE.md is long. |
| Duplicating knowledge | Read before writing. Already documented → skip. |
| Committing with failing hooks | Present the error. Don't retry, don't skip hooks. |
| Running slow checks | Phase 1 lint/test only if <10s. |
| Auto-fixing logic | Triage = trivial only. Logic changes need explicit approval. |
| Creating orphan files | Use existing todo/task files. |
| Massive diff (>500 lines) | Summarize by file. Phase 3: commit by area. Phase 4: audit from summaries. |
| Double-debrief | If last commit starts with `debrief:`, skip Phases 1-3. Audit still runs. |
| Skipping audit on exploration sessions | Discovery sessions with no code changes often produce the richest Context and Intent findings. |
| High context usage | Debrief runs late in sessions. Keep total tool calls under 30. Targeted reads over full file reads. |
