# Todo

## Now
- [x] Build skill scaffolding command (`npm run create -- <skill-name>`) — generates directory, SKILL.md with valid frontmatter, runs validation after creation

## Soon
- [ ] Skill evaluation & trigger testing framework — `eval-set.json` per skill with test queries and `should_trigger` flags, `npm run eval` to verify activation and output quality
- [ ] Set up GitHub remote and push repo
- [ ] npm postinstall hook so `npm install @quigleybits/claude-skills` auto-links skills into `~/.claude/skills/`

## Later
- [ ] Cross-platform export script (`npm run export -- --target cursor,codex,aider`) — converts SKILL.md to other AI tool formats
- [ ] Watch mode for live dev (auto-sync on file change)
- [ ] Token budget planner (select which skills fit within a budget)
- [ ] Skill conflict detection (find contradictions between skills)
- [ ] CI/CD pipeline for automated validation on push
