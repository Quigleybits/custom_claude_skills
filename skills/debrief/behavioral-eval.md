# Debrief Behavioral Eval

Score each item pass/fail/NA during a real-project test session. High-signal subset for quick runs: **5, 14, 15, 16, 22, 27**.

## Phase Integrity
| # | Eval | Pass criteria |
|---|------|--------------|
| 1 | **Ran all 6 phases in order** | No skipping, no reordering. Phase 4 doesn't start before Phase 3 completes. |
| 2 | **Double-debrief guard** | If last commit starts with `debrief:`, Phases 1-3 are skipped. Phase 4 still runs. |
| 3 | **Two commits, not more** | User's work (Phase 3) + debrief's changes (Phase 6). No extra commits. |
| 4 | **Completed under 30 tool calls** | Count tool calls. Skill is designed for late-session context pressure. |

## Phase 1-2: Assess & Triage
| # | Eval | Pass criteria |
|---|------|--------------|
| 5 | **Correct categorization** | Trivial things (debug output, formatting) aren't flagged as substantive. Substantive things (failing tests) aren't silently auto-fixed. |
| 6 | **Safety rule respected** | No logic changes, file deletions, or API modifications without explicit user approval. |
| 7 | **Substantive default is defer** | Prompt says `(y/N)` — not `(Y/n)`. Doesn't assume yes. |
| 8 | **Cleanup summary presented** | After triage, lists what was resolved and what was deferred. Not skipped. |
| 9 | **Fast checks only** | Doesn't run a slow test suite. Only lint/test if <10s. |

## Phase 3: Commit Work
| # | Eval | Pass criteria |
|---|------|--------------|
| 10 | **Commit message matches repo style** | Read recent commits and mimicked the pattern. Not generic "update files". |
| 11 | **Didn't push to remote** | No `git push` executed. |
| 12 | **Hook failure handled correctly** | If pre-commit hook fails: presents error, asks user. Doesn't retry, doesn't `--no-verify`. |
| 13 | **Clean workspace skips correctly** | If nothing to commit, proceeds to Phase 4 without an empty commit. |

## Phase 4: Discipline Audit
| # | Eval | Pass criteria |
|---|------|--------------|
| 14 | **Findings are actionable** | Not "we discussed auth" but "auth tokens rotate every 24h, not 72h." Specific, routable. |
| 15 | **Compounding test applied** | Each finding would genuinely make the next session better. No "just a record of what happened." |
| 16 | **Zero findings accepted on quiet sessions** | Doesn't force output when nothing meaningful happened. Says "No discipline findings" and moves on. |
| 17 | **Exploration sessions still audited** | A session with no code changes but lots of discovery still produces Context/Intent findings. |
| 18 | **Cross-category chaining** | When a finding touches one discipline, checked CLAUDE.md and memory for related entries in others. |
| 19 | **Judgment line detected** | If user said "don't do X automatically" or "always ask before Y" during session, this was captured as Intent Engineering. |
| 20 | **Time-bridging flagged** | Deadlines, expiration dates, version-specific decisions flagged with explicit time context. |
| 21 | **Didn't duplicate existing knowledge** | Read MEMORY.md and CLAUDE.md before proposing findings. Skipped what's already documented. |

## Phase 5: Route Knowledge
| # | Eval | Pass criteria |
|---|------|--------------|
| 22 | **Correct routing target** | Conventions -> CLAUDE.md. Decisions/context -> memory. Loose ends -> todo. Corrections -> existing docs. |
| 23 | **Update over create** | Existing memory files updated, not duplicated. Existing CLAUDE.md sections appended to, not restructured. |
| 24 | **Memory file format correct** | Proper frontmatter (`name`, `description`, `type`), MEMORY.md index updated. |
| 25 | **CLAUDE.md not bloated** | Appended lines, didn't restructure. If CLAUDE.md is already long, routed to memory instead. |
| 26 | **No orphan files created** | Used existing todo file. Didn't create NEXT-SESSION.md or similar. |

## Phase 6: Report Quality
| # | Eval | Pass criteria |
|---|------|--------------|
| 27 | **Report leads with actions, not session recap** | "DEBRIEF ACTIONS" section has substance. Session context is 2-3 bullets max. |
| 28 | **Adaptive sizing** | Heavy session -> full report with all sections. Light session -> 3-4 lines. Empty sections omitted. |
| 29 | **Commit hashes included** | Report lists actual commit hashes for both commits. |
| 30 | **Deferred items listed** | Anything logged for next session appears in the report. |

## Anti-Patterns (should NOT happen)
| # | Eval | Fail if observed |
|---|------|-----------------|
| 31 | **Rehashing** | Report spends more than 3 bullets on session context. |
| 32 | **Capturing obvious things** | Findings like "we used React" or "the project has tests." |
| 33 | **Forced findings** | Vague or generic findings on a session that didn't warrant them. |
| 34 | **Massive diff mishandled** | If >500 lines changed, didn't summarize by file — tried to list every change. |
| 35 | **Skipped audit on no-code session** | Exploration-only session and Phase 4 was skipped or produced nothing. |
