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
**Budget:** ≤30 tool calls total. Debrief runs late in sessions — context efficiency is critical.

---

## Phase 1-2: Assess & Triage

**Checks (parallel where possible):**
- `git status` + `git diff` — uncommitted changes, untracked files
- Lint/test — only if project has a fast check (<10s). If >10s, check `git diff` files for syntax errors only, or defer test verification to user.
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

Find first, categorize after. Concrete checklist:

1. Is CLAUDE.md still accurate after this session's changes?
2. Did any user correction reveal a preference or boundary? ("don't do X", "always ask before Y")
3. Were there untested behavior changes or edge cases discovered?
4. Did missing context cause problems? Is any file now known to be critical?
5. Are there dates, deadlines, or version-specific decisions to capture?
6. Did a trade-off get decided or a priority clarified?
7. Did a task decomposition or dependency pattern emerge?

Tag each finding: **Prompt Craft** (guardrails, instructions) · **Context** (critical files, missing info) · **Intent** (trade-offs, boundaries) · **Specification** (acceptance criteria, edge cases) · **Task** (decomposition, ordering).

### Enhancement Lenses

**Always apply:**
- **Compounding Test** — "Will this make the next session better?" If yes, capture. If it's just a record of what happened, skip.
- **Capture Consistency** — Read MEMORY.md index before writing. Tag each finding: discipline, routing target, new vs update.

**Apply when triggered:**
- **Cross-Category** — If a finding touches multiple disciplines, grep CLAUDE.md and memory for related entries.
- **Judgment Line** — If session involved user corrections ("don't do X", "always ask before Y"), capture as Intent findings.
- **Time-Bridging** — If findings mention dates, deadlines, or "until"/"expires", route to memory with explicit time context.

**Rules:**
- Zero findings is valid. Don't force output on quiet sessions.
- Each finding must be **actionable** — not "we discussed auth" but "auth tokens rotate every 24h, not 72h."
- For large repos: parallelize file reads within this phase.

---

## Phase 5: Route Knowledge

Route by **durability** — how the finding persists, not what category it fits:

| Target | Route here when... | How |
|--------|-------------------|-----|
| **CLAUDE.md** | Finding describes how code works now, or is a convention/guardrail agents need every session | Append to relevant section |
| **Memory files** | Finding explains why a decision was made, captures user preferences, or has time-bound relevance | Write/update in `~/.claude/projects/.../memory/`, update MEMORY.md. Use frontmatter: `name`, `description`, `type` (user/feedback/project/reference). If MEMORY.md doesn't exist, create it. |
| **Todo** | Deferred loose ends, work items too big for session-end | Append to project's existing todo file. If no todo file exists, create a `deferred.md` memory file (type: project). |
| **Existing docs** | Finding directly contradicts or fills a gap in existing documentation | Edit in place |

**Rules:** Update over create. Minimal edits — append, don't restructure. No duplicates — read before writing.

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
| Auto-fixing logic | Triage = trivial only. Logic changes need explicit approval. |
| Creating orphan files | Use existing todo/task files. If none exist, use a `deferred.md` memory file. |
| Massive diff (>500 lines) | Summarize by file. Phase 3: commit by area. Phase 4: audit from summaries. |
| Double-debrief | If last commit starts with `debrief:`, skip Phases 1-3. Audit still runs. |
| Skipping audit on exploration sessions | Discovery sessions with no code changes often produce the richest Context and Intent findings. |
| Running slow checks | If >10s, check `git diff` files for syntax errors only, or defer to user. |
