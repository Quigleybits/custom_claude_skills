---
name: handoff
description: Generate a paste-ready session handoff prompt for continuing work in a new Claude Code session. Use when the user types "/handoff", or says "session handoff", "wrap up the session", "transition to a new session", "hand off to next session", "end-of-session summary", or asks for a summary that the next session can use as its starting prompt. Produces a structured 5-section prompt covering completed work, current state, next steps, learnings, and expectations. Output is one fenced markdown block, paste-ready.
---

# Session Handoff

Generates a self-contained prompt that the user pastes into a new Claude Code session so it can pick up the current work cold — no re-exploration, no lost context.

## When to invoke

Trigger on any of:

- The slash command `/handoff`
- Phrases like "session handoff", "hand off to next session", "wrap up this session", "transition to a new session", "end-of-session summary", "give me a handoff prompt"

Do **not** invoke for general "summarize what we did" requests unless the user clearly intends to stop the current session and resume elsewhere — a casual recap is not a handoff.

## What to do

### 1. Gather state — read, don't ask

Before writing anything, gather the facts. Use tools, not questions. Inspect:

| Source | What to extract |
|---|---|
| `git status` | Branch, worktree path, dirty files |
| `git log --oneline -20` (or since session start if obvious) | Commits made this session |
| Active plan file (path appears in plan-mode `<system-reminder>` if relevant) | Approved approach, deferred items |
| TodoWrite list (this turn or recent) | Done vs in-progress vs pending |
| Conversation tool history | Files actually touched, decisions accepted via AskUserQuestion |
| Recent build/test output | Last verified status (green/red) |
| Environment quirks surfaced this session | Broken symlinks, missing env vars, manual setup steps |

If a section would be empty after gathering, **omit it** rather than writing "n/a".

### 2. Render the handoff

Output exactly one fenced markdown block — nothing else, no preamble, no trailing prose. The user copies the block and pastes it as the opening prompt of the next session.

Use this template verbatim. Replace `{placeholders}`. Drop placeholders that don't apply.

````markdown
# Session Handoff — {project name or branch}

> Generated {YYYY-MM-DD HH:mm}. Paste as the opening prompt of the next session.

## 1. What was completed
- {concrete deliverable, with file paths in `code` style or [markdown links](relative/path)}
- {feature implemented or updated}
- {decision made, with one-line rationale}

## 2. Current state
- **Branch / worktree**: `{branch}` at `{worktree path}`
- **Build status**: {green / red — last verified command and result}
- **Done**: {what's shipped this session}
- **In progress**: {what's mid-work, with the exact stopping point}
- **Blockers / pending**: {open issues, with `file:line` refs}

## 3. Next steps (in suggested order)
1. **{Top-priority task}** — {one-line why; concrete first action}
2. **{Next task}** — {…}
3. **{Optional / nice-to-have}** — {…}

## 4. Key learnings (carry forward)
- {pattern, constraint, or gotcha worth remembering}
- {repo-specific quirk discovered}

## 5. Expectations for the next session
- **Focus**: {one sentence}
- **Watch out for**: {pitfalls, e.g. "don't commit `.env.local` changes"}
- **Open questions for the user**: {only if any}

---

### Quick-start commands
```bash
cd {worktree path}
{any setup the next session must run, e.g. npm install, ln -s ...}
```
````

### 3. After rendering

End the turn with one short line:

> Anything to add or correct before you copy this?

Wait for the user's reply. If they request changes, regenerate the block. If they're satisfied, stop — they'll paste it themselves.

## Style rules

- **Concise.** Each bullet ≤ 2 lines. No conversational recap, no apologies, no "we worked on...".
- **Concrete.** File paths, function names, exact commands. Vague bullets like "improved styling" are useless to the next session.
- **Self-contained.** A fresh Claude with no memory of this conversation should be able to act on the handoff without asking what anything means.
- **Skip empty sections.** If "Key learnings" has nothing, omit the heading.
- **No secrets.** Never include API keys, tokens, `.env*` contents, or auth headers in the handoff.
- **Cite files as markdown links** with paths relative to the working directory: `[tokens.css](src/styles/tokens.css)` or `[Button.tsx:42](src/components/ui/Button.tsx:42)`.
- **Target ~60 lines** for a typical session. Cut ruthlessly if longer.
- **No memory side-effects.** This skill does not write to memory; that's the `consolidate-memory` skill's job. Don't conflate.

## Failure modes to avoid

- Writing the handoff *outside* the markdown code fence (the user can't one-click copy).
- Padding sections with pleasantries to look thorough.
- Asking the user clarifying questions before generating — gather facts from tools instead.
- Including the literal `{placeholder}` text if a section truly has no content — omit the section entirely.
- Forgetting the date/time line at the top.
