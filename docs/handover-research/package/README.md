# claude-handoff-skill

A [Claude Code](https://claude.com/claude-code) skill that generates a paste-ready **session handoff prompt** so the next session picks up your work cold — no re-exploration, no lost context.

When you type `/handoff` (or "wrap up the session", "session handoff", etc.), Claude gathers the state of the current session — git status, recent commits, plan file, todos, files touched, decisions made, environment quirks — and renders a structured 5-section prompt inside a single markdown code block. You copy it. You paste it as the opening prompt of your next Claude Code session. That session starts already aware of where you left off.

## Install

```bash
npx claude-handoff-skill install
```

This drops `SKILL.md` into `~/.claude/skills/handoff/`. Restart Claude Code (start a new session) for the skill to register.

### Update

```bash
npx claude-handoff-skill update
```

### Uninstall

```bash
npx claude-handoff-skill uninstall
```

### Project-level install

To install the skill into a single project instead of your user scope:

```bash
CLAUDE_SKILLS_DIR=./.claude/skills npx claude-handoff-skill install
```

Now the skill lives at `<project>/.claude/skills/handoff/` and travels with the repo if you commit it.

## Use

Trigger the skill any of these ways once installed:

- Type `/handoff`
- Say "session handoff", "wrap up the session", "transition to a new session", or "give me a handoff prompt"

Claude will produce a single fenced markdown block with five sections: completed work, current state, next steps, learnings, expectations. Copy the block. Paste it as the first message of a new session. That's it.

## What the prompt looks like

```markdown
# Session Handoff — capture-revamp / claude/foo-bar

> Generated 2026-05-05 18:00. Paste as the opening prompt of the next session.

## 1. What was completed
- Built design-system foundation: tokens.css, motion primitives, ui/ shell
- Migrated ConfirmActionModal + AddInstrumentModal to <Modal>
- ...

## 2. Current state
- **Branch / worktree**: claude/foo-bar at /path/to/worktree
- **Build status**: green — `npm run build` passing
- ...

## 3. Next steps (in suggested order)
1. **Rebuild PortfolioAnalyticsPanel** — strip blur glows, replace with FadeIn
2. ...

## 4. Key learnings
- @tradelab/core file: deps need a bridge symlink in worktrees ...

## 5. Expectations for the next session
- **Focus**: Apply foundation primitives to dashboard screens.
- **Watch out for**: don't blanket-apply font-mono to <td> ...

---

### Quick-start commands
\`\`\`bash
cd /path/to/worktree
ln -sf /abs/path/to/dep <bridge target>
\`\`\`
```

## Why a skill, not a slash command or alias?

A skill is just instructions Claude reads when you trigger it — no infrastructure. The output is fully dynamic (computed from your actual git/todo/plan state at the moment you invoke), and you can refine the prompt by editing one markdown file.

## Source

The skill itself is one file: [`skill/SKILL.md`](./skill/SKILL.md). The package adds nothing more than a tiny zero-dependency Node installer ([`bin/claude-handoff-skill.js`](./bin/claude-handoff-skill.js)) that copies the file into your skills directory.

## Contributing

PRs welcome. The skill is small enough that improvements usually mean tightening the output template or expanding the trigger keywords. Bump the version per [Versioning](#versioning), edit `skill/SKILL.md`, and open a PR.

### Versioning

- **Patch** (1.0.x): Wording tweaks, added trigger keywords.
- **Minor** (1.x.0): Output template additions that remain backward compatible.
- **Major** (x.0.0): Breaking changes to the output format.

## License

MIT
