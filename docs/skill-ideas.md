# Skill Ideas

Candidate skills derived from analysis of 19 AI strategy transcripts (2026-02-26 through 2026-03-17). Ranked by buildability, impact, and differentiation from existing skills.

## 1. `/frontier`

**Status:** Next to build
**Source:** "Every AI skill you learned is already wrong" (Mar 1) + "Stop accepting AI output that looks right" (Mar 10)
**Combines:** frontier-map + failure-model

**What it does:** Given a task type or domain, maps the AI delegation boundary and generates domain-specific failure patterns with verification criteria.

**The problem it solves:** People either over-trust AI (delegate everything, miss failures) or under-trust it (do everything manually, waste leverage). The boundary moves every quarter as models improve, so static rules don't work. Generic skepticism ("always check the output") is useless — you need to know *where* AI fails in *your* domain.

**How it works:**
1. User provides a task type or domain ("database migrations", "legal contract review", "React components", "financial modeling")
2. Skill maps three zones:
   - **Delegate confidently** — tasks where AI reliability is high and failure cost is low
   - **Delegate with verification** — tasks where AI is capable but failure patterns exist
   - **Keep human** — tasks where current models reliably fail or failure cost is catastrophic
3. For the middle zone, generates specific failure patterns (not generic checklists):
   - What the failure looks like (how it presents)
   - Why the model fails here (structural reason)
   - How to catch it (verification step)
4. Outputs a verification protocol: ordered checks, escalation triggers, and "when in doubt" defaults

**Key design decision:** The skill should ask the user what they've seen go wrong, not just generate from training data. Real failure models come from experience + structure, not theory.

**Trigger:** "What can I safely delegate?", "Where does AI fail at [X]?", "Build me a verification checklist for [X]", "What should I review manually vs trust the agent?"

---

## 2. Recon v0.2 Enhancements

**Status:** Planned enhancement to existing `/recon` skill
**Source:** "Claude blackmailed its developers" (Mar 9) + "OpenAI leaked GPT-5.4" (Mar 5)
**Incorporates ideas from:** intent-checker, context-planner

**New capabilities to fold into recon's existing pipeline:**

### Intent completeness check (Phase 5 enhancement)
During doc health audit, check CLAUDE.md and agent instruction files for intent completeness:
- Are constraints specified? (what NOT to do)
- Are escalation conditions defined? (when to stop and ask)
- Are value hierarchies explicit? (if goal and constraint conflict, which wins?)
- Are failure modes addressed? (what does graceful degradation look like?)

Flag output-focused instructions ("deploy this code") and suggest intent-complete rewrites ("deploy this code by EOW; not urgent enough to skip tests; if fails, rollback not workaround; ambiguity → ask human").

### Context fragmentation detection (Phase 4 enhancement)
During synthesis, assess whether project knowledge would survive a key-person departure:
- Are architectural decisions documented or only in git history?
- Are there "tribal knowledge" gaps (things only one person knows)?
- Is context structured for agent consumption or only human-readable?

This extends recon's existing gap analysis with a durability dimension.

---

## 3. `/harness-audit`

**Status:** Planned
**Source:** "Claude Code vs Codex" (Mar 6)

**What it does:** Holistic health check of your Claude Code setup. Not "what should you add?" (that's `claude-automation-recommender`) or "is your CLAUDE.md good?" (that's `claude-md-improver`). This answers: "How well is your full harness working *together*?"

**The problem it solves:** The transcript shows the model is 30% of value; the harness is 70%. Same Claude scored 78% vs 42% on identical benchmarks depending on harness. Most users optimize one piece (CLAUDE.md) and ignore the rest. Nobody audits whether their skills, hooks, MCP servers, memory, and git workflow are coherent.

**What it checks:**
- **CLAUDE.md coherence** — Do instructions reference tools/skills that actually exist? Are there contradictions between project and global instructions?
- **Skill coverage** — What skills are installed? Do their triggers overlap or conflict? Are there workflow gaps?
- **Hook health** — Are hooks configured? Do they fire correctly? Are there missing hook opportunities (pre-commit, post-tool-use)?
- **MCP server inventory** — What's connected? Token cost of tool descriptions? Are any stale or unused?
- **Memory health** — How many memory files? Stale entries? Duplicates? Is the index (MEMORY.md) in sync?
- **Git workflow** — Worktree usage? Commit frequency? Branch hygiene?
- **Integration score** — Do the pieces reference each other? (e.g., CLAUDE.md mentions skills, hooks enforce CLAUDE.md rules, memory tracks project state)

**Output:** A scorecard with grades per dimension and specific recommendations. Not "add X" but "your CLAUDE.md says to run tests before committing but you have no pre-commit hook enforcing it — here's the fix."

**Trigger:** "Audit my Claude Code setup", "Is my harness optimized?", "How well is my Claude setup working?"

---

## 4. `/concon`

**Working names:** `/concon` (/concon = constraint condensation... /distill preferred by opus — you're distilling scattered rejections into concentrated constraints), `/conlib` (constraint library — more literal), `/rejects` (too negative)

**Status:** Planned — most novel, most complex (hook + skill combo)
**Source:** "Stop accepting AI output that looks right" (Mar 10)

**The problem it solves:** The transcript's core insight: generation is commodity, rejection is the skill. But 99% of rejections evaporate — they happen in chat, email, Slack, and are never encoded. The same rejection happens tomorrow because the constraint was never captured. "Frontier of AI value = frontier of your organization's encoded taste."

**Architecture — two layers:**

### Layer 1: Auto-trigger (PreCompact hook)
Claude Code has a `PreCompact` hook that fires right before auto-compaction. This is the key mechanism:

1. Auto-compact triggers at ~95% context (configurable via `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=75`)
2. `PreCompact` hook fires → script exits with code 2 → **blocks compaction**
3. Block reason sent to Claude: "Run /concon to capture constraints before compacting"
4. Claude runs `/concon`, encodes rejections into CLAUDE.md/memory
5. Hook writes a temp flag file (e.g., `/tmp/.concon-done-{session}`)
6. Next compaction attempt → hook sees flag → exits 0 → compaction proceeds
7. Flag is cleaned up

No transcript parsing. No file size estimation. The system tells us exactly when compaction is imminent.

### Layer 2: Capture (Stop hook — lightweight)
A `Stop` hook runs after every agent turn to passively log rejection signals:
- Parses `last_assistant_message` from stdin for correction patterns
- Detects: "no", "not that", "instead do", "don't", "wrong", "that's not what I meant"
- Appends structured entries to `.claude/rejections.jsonl`:
```json
{"timestamp": "...", "signal": "correction", "context": "...", "session": "..."}
```
This is passive capture only — lightweight, no blocking.

### Layer 3: Encode (the `/concon` skill)
Triggered automatically by the PreCompact hook, or manually anytime. The skill:
1. Reads the rejection log (`.claude/rejections.jsonl`)
2. Reads current conversation context (richest source — about to be compressed)
3. Reads existing CLAUDE.md constraints and feedback memories
4. Identifies patterns:
   - Recurring rejections (same mistake across sessions → systemic gap)
   - One-off corrections (may not need encoding)
   - Contradictions (later rejection overrides earlier one)
5. Proposes new CLAUDE.md rules or memory entries, grouped by confidence:
   - **High confidence:** Same rejection 3+ times → auto-encodable
   - **Medium confidence:** Rejection with clear "because" reasoning → suggest encoding
   - **Low confidence:** Single occurrence → log but don't encode yet
6. User approves/rejects proposed encodings (same picker pattern as recon doc health)
7. Cleans processed entries from the log

**When it runs:**
- **Automatically** — PreCompact hook blocks compaction, tells Claude to run `/concon` first
- **Manually** — User runs `/concon` anytime (session end, weekly review)
- **Configurable threshold** — Set `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=75` for earlier trigger

**Key insight from transcript:** The three dimensions of rejection are learnable:
- **Recognition** — detecting something is wrong (domain experience)
- **Articulation** — explaining why in usable constraints (the hard part)
- **Encoding** — making it persist (what this skill automates)

The skill handles encoding. Over time, it also helps with articulation by showing the user patterns and asking "why?" when the reason isn't clear from context.

---

## Build Priority

| # | Skill | Type | Complexity | Dependencies |
|---|-------|------|-----------|-------------|
| 1 | `/frontier` | New skill | Medium | None |
| 2 | Recon v0.2 | Enhancement | Low | Existing recon |
| 3 | `/harness-audit` | New skill | Medium-High | Needs to understand Claude Code internals |
| 4 | `/concon` | PreCompact hook + Stop hook + skill | High | Needs hook design + skill + log format |
