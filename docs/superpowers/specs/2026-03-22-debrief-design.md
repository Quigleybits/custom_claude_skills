# `/debrief` — Session-End Skill Design

**Date:** 2026-03-22
**Status:** Approved
**Pairs with:** `/recon` (session bookends — recon opens, debrief closes)

## Overview

Session-end skill that closes out work cleanly, captures knowledge through the 5 engineering disciplines, and routes it to the right persistence targets. Manual invocation via `/debrief`.

**Reporting style:** Output leads with what debrief *did* (actions taken, knowledge routed, items deferred), with brief session context for orientation. Complete but minimal — lists, not prose. Adaptive sizing scales output to session complexity.

## Phase Architecture

Six sequential phases with strict gates. Parallel tool calls within a phase are encouraged for speed in large repos.

```
Phase 1: ASSESS        → Scan workspace state, categorize findings
Phase 2: TRIAGE        → Auto-fix trivial, prompt for substantive, defer big items
Phase 3: COMMIT WORK   → Auto-commit user's changes (skip if clean)
Phase 4: DISCIPLINE AUDIT → 5-discipline pass with enhancement lenses
Phase 5: ROUTE KNOWLEDGE  → Write findings to correct persistence targets
Phase 6: COMMIT & REPORT  → Commit debrief changes, output terse action summary
```

**Constraints:**
- Complete one phase before starting the next
- Entire skill should complete in under 2 minutes for a typical session
- Two commits total: user's work (Phase 3), debrief's changes (Phase 6)

---

## Phase 1: ASSESS

Scan workspace state. No actions taken — gathering facts only.

**Checks (parallel where possible):**
- `git status` — uncommitted changes, untracked files, staged vs unstaged
- `git diff` — what's actually changed
- Lint/test state — only if the project has a fast check (<10s). Skip slow suites.
- Stale TODOs — `TODO`/`FIXME` in uncommitted changes (`git diff`)
- Dangling files — temp files, `.bak`, debug logs. For `console.log`/`print()` statements: only flag if they appear in `git diff` (not pre-existing) and are not in logging/CLI code.

**Categorize each finding as:**
- **Trivial** — formatting, trailing whitespace, staging tracked files, removing debug output
- **Substantive** — failing tests, lint errors, incomplete implementations
- **Deferred** — too big for session-end, needs next-session planning

---

## Phase 2: TRIAGE

Act on ASSESS findings.

| Category | Action |
|---|---|
| **Trivial** | Auto-execute silently. Format, stage, remove debug cruft. |
| **Substantive** | Present to user: "Fix now? (y/N)" — default is defer. Only execute on explicit yes. |
| **Deferred** | Log as next-session work item. No action taken. |

**Safety rule:** Never modify logic, delete files, or alter public APIs without explicit user approval — even if it looks trivial.

**Post-triage:** Present cleanup summary listing what was resolved and what was deferred.

---

## Phase 3: COMMIT WORK

Commit the user's actual work — everything from the session, including triage fixes from Phase 2.

**Guard:** If last commit message starts with `debrief:`, skip Phases 1-3 (prevents double-debrief).

**Flow:**
1. Check if there are changes to commit. If none, skip to Phase 4.
2. Read recent commit messages to match the repo's style.
3. Generate a style-matched commit message.
4. Auto-commit.
5. If commit fails (pre-commit hook), present the error and ask user how to proceed. Don't retry blindly.
6. If user declines to fix: proceed to Phase 4 with uncommitted changes. Note the uncommitted state in the Phase 6 report. Phase 6 still attempts its own commit (debrief docs are separate files, unlikely to hit the same hook).

**Commit scope:** All tracked changes + newly staged files from triage. Untracked intentional files (new source files) get staged. Generated files (`.env`, `node_modules`, build artifacts) get ignored.

**Does NOT:** Push to remote, amend existing commits, or create merge commits.

---

## Phase 4: DISCIPLINE AUDIT

Core differentiator. Single pass across the 5 engineering disciplines asking: "Did anything happen this session that changes how agents should operate here?"

### Base Audit

| Discipline | Signals to Check | Example Finding |
|---|---|---|
| **Prompt Craft** | New guardrails, output format preferences, agent instruction patterns discovered or refined | "User wants test names in `should_X_when_Y` format — add to CLAUDE.md" |
| **Context Engineering** | Files identified as critical context, information that was missing and caused problems, context that was noisy/unhelpful | "src/config/feature-flags.ts is essential context for any feature work" |
| **Intent Engineering** | Trade-offs decided, priorities clarified, boundaries set on what agents should/shouldn't do | "Decided: optimize for read performance over write — inform future schema decisions" |
| **Specification Engineering** | Acceptance criteria refined, requirements clarified, edge cases discovered | "Empty input must return empty array, not null — discovered via bug fix" |
| **Task Engineering** | Work decomposition patterns that worked/didn't, dependency ordering insights, scope lessons | "Auth and billing can be built in parallel but both block the dashboard" |

### Enhancement Lenses

Applied during the same pass — not separate phases:

1. **Cross-Category Reasoning** — Look for connections *between* disciplines. A spec edge case (Specification) that revealed a missing context file (Context) that needs a new guardrail (Prompt Craft). Chain findings, don't silo them. *Concrete: when a finding touches discipline X, grep CLAUDE.md and memory for related entries in other disciplines.*

2. **Judgment Line Detection** — Did anything clarify where the human/agent boundary should be for this project? High-value Intent Engineering findings that prevent future agents from overstepping. *Concrete: check if the session involved user corrections like "don't do X automatically" or "always ask before Y."*

3. **Time-Bridging Signal** — Flag information with future relevance beyond the next session: deadlines, expiration-style events, decisions that will matter in 3+ months. Route to memory with explicit time context. *Concrete: scan findings for dates, version numbers, "until," "after," "before," "deadline," "expires."*

4. **Compounding Test** — For each finding ask: "Will this make the next session better?" If yes, capture it. If it's just a record of what happened, it's noise. This is the quality filter that prevents memory bloat.

5. **Capture Consistency** — Each finding must be actionable and structured. Tagged with: discipline, routing target, and whether it's a new insight vs an update to existing knowledge. *Concrete: before writing, read MEMORY.md index to check for existing entries on the same topic.*

### Rules

- Only surface findings when there's actual signal. A quiet session may produce 0-2 findings. That's fine.
- Each finding must be **actionable** — not "we talked about auth" but "auth tokens must be rotated every 24h, not 72h as previously assumed."
- Findings are tagged with their routing target for Phase 5.
- For large repos: file reads during audit can parallelize.

---

## Phase 5: ROUTE KNOWLEDGE

Execute routing for each tagged finding from Phase 4.

| Target | What Goes Here | How |
|---|---|---|
| **CLAUDE.md** | Conventions, guardrails, agent instructions, coding patterns | Append to relevant section, or create section if new category |
| **Memory files** | Decisions, project context, user preferences, time-bridging signals | Write/update files in `~/.claude/projects/.../memory/`, update MEMORY.md index |
| **Todo / next-session** | Deferred loose ends, work items too big for session-end | Append to project's existing todo file. Don't create orphan files. |
| **Existing docs** | Corrections or additions to repo documentation | Edit in place — only if the finding directly contradicts or fills a gap |

### Rules

- **Update over create** — Check if an existing memory file or CLAUDE.md section already covers the topic before creating new entries. Deduplicate.
- **Minimal edits** — Add lines, don't restructure. Debrief shouldn't rewrite docs, just append signal.
- **No duplicates** — If a finding is already documented (discovered during Phase 4 reads), skip it.
- **Structured format** — Memory files use Claude Code's auto-memory frontmatter: `name`, `description`, `type` (user/feedback/project/reference) in YAML between `---` markers. CLAUDE.md additions match existing style.
- **Routing priority** — When a finding could go to CLAUDE.md or memory, prefer memory files. CLAUDE.md is for conventions and instructions agents need every session; memory is for decisions and context that may be relevant.

---

## Phase 6: COMMIT & REPORT

### Commit

Auto-commit debrief's documentation and memory changes only (triage fixes were committed with user's work in Phase 3):

```
debrief: session wrap-up

Knowledge captured:
- [list of docs/memory updates, with discipline tags]

Deferred:
- [list of next-session items]
```

### Report

Terse terminal output. Adaptive sizing — sections with zero items are omitted.

```
SESSION CONTEXT
- [2-3 bullet summary of what the session was about]

DEBRIEF ACTIONS
Loose ends resolved:
- [triage actions taken]

Knowledge routed:
- [file: change description [Discipline]]

Deferred to next session:
- [items logged for next time]

Commits:
- [hash] "message" (user work)
- [hash] "message" (debrief updates)
```

Light sessions with no findings shrink to 3-4 lines. No padding.

---

## Common Mistakes

| Mistake | Correction |
|---|---|
| Rehashing the session | Report debrief's actions. Session context is 2-3 bullets max. |
| Capturing obvious things | Apply compounding test: "Will this make the next session better?" |
| Bloating CLAUDE.md | Append lines, don't restructure. If CLAUDE.md is long, prefer memory files. |
| Duplicating existing knowledge | Read before writing. If already documented, skip. |
| Committing with failing tests | Present pre-commit hook errors. Don't retry, don't skip hooks. |
| Running slow checks | Phase 1 lint/test scan only if check completes in <10s. |
| Auto-fixing logic | Triage only touches trivial things. Never modify logic without approval. |
| Creating orphan files | Use existing todo/task files. Don't create NEXT-SESSION.md if alternatives exist. |
| Forcing audit on empty sessions | Zero findings is valid. Report "No discipline findings" and move on. |

## Edge Cases

- **No uncommitted changes** — Skip Phase 3, proceed to audit.
- **Massive diff (>500 lines)** — Affects all phases. Phase 1: summarize by file, parallel reads. Phase 3: commit message summarizes by area, not line-by-line. Phase 4: audit based on file-level summaries, not full diff.
- **Merge conflicts in CLAUDE.md** — Don't resolve. Flag in report, let user handle.
- **Exploration-only session** — Audit still runs. Discovery sessions often produce the richest Context and Intent Engineering findings.
- **Double-debrief** — If last commit starts with `debrief:`, skip Phases 1-3. Phase 4 audit still runs (user may have continued working after first debrief).
- **High context usage** — Debrief runs at session end when context may be near capacity. Keep total tool calls under 30. Prefer targeted reads over full file reads.
