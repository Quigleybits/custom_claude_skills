# Todo

## Soon
- [ ] Skill evaluation & trigger testing framework — `eval-set.json` per skill with test queries and `should_trigger` flags, `npm run eval` to verify activation and output quality

## Later
- [ ] Cross-platform export script (`npm run export -- --target cursor,codex,aider`) — converts SKILL.md to other AI tool formats
- [ ] Watch mode for live dev (auto-sync on file change)
- [ ] Token budget planner (select which skills fit within a budget)
- [ ] Skill conflict detection (find contradictions between skills)
- [ ] CI/CD pipeline for automated validation on push
- [ ] Selective skill installer CLI (`npx @quigleybits/claude-skills install recon`) — lets users pick individual skills instead of installing all

## Done
- [x] Build skill scaffolding command (`npm run create -- <skill-name>`)
- [x] Refine recon category definitions (Prompt Craft/Context/Intent/Specification/Task Engineering)
- [x] Set up GitHub remote and push repo
- [x] npm postinstall hook for auto-linking on install
