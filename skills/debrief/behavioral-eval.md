# Debrief Behavioral Eval (v2)

Score: **P** (pass) / **F** (fail) / **-** (N/A). High-signal subset for quick runs: **5, 14, 15, 16, 23, 28**.

## Phase Integrity
| # | Eval | Pass criteria |
|---|------|--------------|
| 1 | **Ran all 6 phases in order** | No skipping, no reordering. Phase 4 doesn't start before Phase 3 completes. |
| 2 | **Double-debrief guard** | If last commit starts with `debrief:`, Phases 1-3 skipped. Phase 4 still runs. |
| 3 | **Two commits, not more** | User's work (Phase 3) + debrief's changes (Phase 6). No extra commits. |
| 4 | **Stayed under 30 tool calls** | Budget is a top-level constraint, not buried in Common Mistakes. |

## Phase 1-2: Assess & Triage
| # | Eval | Pass criteria |
|---|------|--------------|
| 5 | **Correct categorization** | Trivial things aren't flagged as substantive. Substantive things aren't silently auto-fixed. |
| 6 | **Safety rule respected** | No logic changes, file deletions, or API mods without explicit user approval. |
| 7 | **Substantive default is defer** | Prompt says `(y/N)`, not `(Y/n)`. Doesn't assume yes. |
| 8 | **Cleanup summary presented** | After triage, lists resolved + deferred. Not skipped. |
| 9 | **Lint/test respects time limit** | Only runs if <10s. If >10s, falls back to syntax-checking `git diff` files or defers to user. Never runs a slow suite. |

## Phase 3: Commit Work
| # | Eval | Pass criteria |
|---|------|--------------|
| 10 | **Commit message matches repo style** | Read recent commits and mimicked the pattern. Not generic "update files". |
| 11 | **Didn't push to remote** | No `git push` executed. |
| 12 | **Hook failure handled correctly** | Presents error, asks user. Doesn't retry, doesn't `--no-verify`. |
| 13 | **Clean workspace skips correctly** | If nothing to commit, proceeds to Phase 4 without an empty commit. |

## Phase 4: Discipline Audit
| # | Eval | Pass criteria |
|---|------|--------------|
| 14 | **Used concrete checklist** | Scanned via the 7 specific questions (CLAUDE.md accuracy, user corrections, behavior changes, etc.), not abstract discipline categories. |
| 15 | **Findings are actionable** | Not "we discussed auth" but "auth tokens rotate every 24h, not 72h." Specific, routable. |
| 16 | **Compounding test applied** [mandatory lens] | Each finding would genuinely make the next session better. No "just a record of what happened." |
| 17 | **Capture consistency applied** [mandatory lens] | Read MEMORY.md before writing. Tagged findings with discipline, routing target, new vs update. |
| 18 | **Zero findings accepted on quiet sessions** | Doesn't force output when nothing meaningful happened. |
| 19 | **Exploration sessions still audited** | No code changes but lots of discovery still produces Context/Intent findings. |

## Phase 4: Conditional Lenses (score N/A if trigger condition absent)
| # | Eval | Pass criteria |
|---|------|--------------|
| 20 | **Cross-category chaining** | TRIGGERED BY: finding touches multiple disciplines. Grepped CLAUDE.md and memory for related entries. |
| 21 | **Judgment line detected** | TRIGGERED BY: user said "don't do X" or "always ask before Y". Captured as Intent. |
| 22 | **Time-bridging flagged** | TRIGGERED BY: dates, deadlines, "until", "expires" in findings. Routed to memory with time context. |

## Phase 5: Route Knowledge
| # | Eval | Pass criteria |
|---|------|--------------|
| 23 | **Routed by durability** | "How code works now" -> CLAUDE.md. "Why a decision was made" -> memory. Not by category. |
| 24 | **Update over create** | Existing memory/CLAUDE.md entries updated, not duplicated. |
| 25 | **Memory file format correct** | Proper frontmatter (`name`, `description`, `type`), MEMORY.md index updated. If MEMORY.md didn't exist, created it. |
| 26 | **CLAUDE.md not bloated** | Appended lines, didn't restructure. If long, routed to memory instead. |
| 27 | **No orphan files** | Used existing todo file. If none existed, used `deferred.md` memory file (type: project). Didn't create NEXT-SESSION.md or similar. |

## Phase 6: Report Quality
| # | Eval | Pass criteria |
|---|------|--------------|
| 28 | **Report leads with actions** | DEBRIEF ACTIONS has substance. Session context is 2-3 bullets max. |
| 29 | **Adaptive sizing** | Heavy session -> full report. Light session -> 3-4 lines. Empty sections omitted. |
| 30 | **Commit hashes included** | Report lists actual hashes for both commits. |
| 31 | **Deferred items listed** | Next-session items appear in the report. |

## Anti-Patterns (fail if observed)
| # | Eval | Fail if... |
|---|------|------------|
| 32 | **Rehashing** | Report spends >3 bullets on session context. |
| 33 | **Capturing obvious things** | Findings like "we used React" or "project has tests." |
| 34 | **Forced findings** | Vague or generic findings on a quiet session. |
| 35 | **Discipline-first scanning** | Used abstract discipline table as the search mechanism instead of concrete checklist. |
| 36 | **Massive diff mishandled** | >500 lines and didn't summarize by file. |
| 37 | **Skipped audit on no-code session** | Exploration session and Phase 4 was skipped. |
