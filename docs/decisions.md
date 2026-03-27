# Decisions

Design decisions and trade-off rules for the @quigleybits/claude-skills suite. Captures the "why" behind choices that aren't obvious from code alone.

## Active Decisions

### D1: Depth over breadth — cut skills before compromising quality

**Decision:** The suite targets 5 skills maximum. If a skill can't meet the quality bar (tested on real codebases, correct trigger behavior, <1500 words), it gets cut rather than shipped at lower quality.

**Why:** A few excellent skills that reliably produce high-signal output beats a large collection of mediocre ones (vision.md). The debrief spec review caught 10 design issues and the plan review caught 3 more — this only works because the workflow (brainstorm → spec → plan → implement) is thorough per skill.

**Trade-off:** Suite completion takes longer. Each skill requires 3-5 sessions of work. Acceptable because users install all skills at once — one bad skill degrades trust in the whole package.

### D2: Inline execution over subagent-driven for skill implementation

**Decision:** Use inline plan execution (single session, sequential tasks) for building skills, not subagent-driven parallel execution.

**Why:** Validated during debrief build. Context from the brainstorming phase carries forward and informs implementation decisions. Subagent-driven execution loses that context across parallel workers. Reserve subagent-driven for plans with genuinely independent parallel tasks.

**Trade-off:** Slower execution, but fewer defects and better design coherence.

### D3: Prescriptive skills are not reality-checked

**Decision:** During recon, skills (SKILL.md files) and templates are treated as prescriptive content — they describe desired behavior, not current codebase state. Recon skips reality-checking them.

**Why:** Skills contain instructions, flowcharts, and behavioral specifications. Verifying "does this function exist?" against a code block in a skill file produces false positives. Only descriptive docs (README, status files, specs) get reality-checked.

### D4: Five disciplines as shared vocabulary

**Decision:** All skills use the same 5-discipline categorization: Prompt Craft, Context Engineering, Intent Engineering, Specification Engineering, Task Engineering.

**Why:** Consistent vocabulary across recon, debrief, and future skills means users build one mental model. The disciplines are defined in `docs/skill-spec.md` and referenced by every skill that touches documentation.

**Trade-off:** New skills must fit their output into this framework even when the mapping isn't perfect. Acceptable because the categories are broad enough to cover most agent-related documentation.

### D5: npm package ships all skills together

**Decision:** @quigleybits/claude-skills installs all skills at once via postinstall symlinks. No selective installation (yet).

**Why:** Simplicity for v1. The suite is designed as a coherent set (recon opens sessions, debrief closes them, roe defines engagement rules, etc.). Selective installation is on the backlog (todo.md) but not needed until the skill count grows beyond the initial 5.

**Trade-off:** Users who only want one skill get all of them in ~/.claude/skills/. Token cost is negligible since skills load on-demand, but the directory gets cluttered.
