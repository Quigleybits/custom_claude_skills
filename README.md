# @quigleybits/claude-skills

Custom skills (slash commands) for [Claude Code](https://claude.ai/claude-code).

## Install

```bash
npm install -g @quigleybits/claude-skills
```

Skills are automatically linked into `~/.claude/skills/` on install and cleanly removed on uninstall.

## Skills

### /recon

Full-spectrum project reconnaissance. Scans all documentation, cross-references claims against the actual codebase, audits doc health, and presents prioritized next steps.

**Use when:** Starting work on a project, resuming after a break, onboarding to a new codebase, or needing to understand current project state.

**What it does:**
1. Discovers all docs (markdown, rst, adoc) + recent git activity
2. Scans and reality-checks claims against the codebase
3. Synthesizes prioritized next steps (Critical / Important / Normal / Low)
4. Identifies missing documentation categories and offers to create them
5. Audits doc health with user-gated fix options

### /debrief

Session-end skill. Cleans up loose ends, captures knowledge through the 5 engineering disciplines, routes findings to persistence targets, and commits everything cleanly. Pairs with `/recon` as session bookends.

**Use when:** Ending a work session, wrapping up, or needing to preserve what was learned before closing out.

**What it does:**
1. Assesses workspace for loose ends (uncommitted changes, TODOs, debug output)
2. Triages and auto-fixes trivial issues, defers larger ones
3. Commits user's work with a style-matched message
4. Audits session against 5 engineering disciplines with enhancement lenses
5. Routes findings to CLAUDE.md, memory files, or todo
6. Commits debrief's documentation updates separately

## Uninstall

```bash
npm uninstall -g @quigleybits/claude-skills
```

## License

MIT
