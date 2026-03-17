# Todo

## Soon
- [ ] Build `/frontier` skill — delegation boundary mapper + domain-specific failure patterns (see `docs/skill-ideas.md`)
- [ ] Recon v0.2 — fold in intent completeness checking + context fragmentation detection
- [ ] Build `/harness-audit` skill — holistic Claude Code setup health check
- [ ] Build `/conlib` skill — constraint library with PreCompact hook auto-trigger (see `docs/skill-ideas.md`)

## Later
- [ ] Cross-platform export script (`npm run export -- --target cursor,codex,aider`) — converts SKILL.md to other AI tool formats
- [ ] Watch mode for live dev (auto-sync on file change)
- [ ] Token budget planner (select which skills fit within a budget)
- [ ] Skill conflict detection (find contradictions between skills)
- [ ] CI/CD pipeline for automated validation on push
- [ ] Selective skill installer CLI (`npx @quigleybits/claude-skills install recon`) — lets users pick individual skills instead of installing all

## Done
- [x] Skill evaluation & trigger testing framework — `eval-set.json` + `scripts/eval-skills.mjs` with Anthropic API integration, 18 test cases for recon, `--dry-run` mode
- [x] Fix stale `~/.claude/skills/recon` copy — replaced with proper symlink to repo
- [x] Skill ideas research — analyzed 19 AI strategy transcripts, distilled 4 prioritized skill candidates (`docs/skill-ideas.md`)
- [x] CC feature requests doc — `docs/cc-feature-requests.md` for tracking desired Claude Code capabilities
- [x] Build skill scaffolding command (`npm run create -- <skill-name>`)
- [x] Refine recon category definitions (Prompt Craft/Context/Intent/Specification/Task Engineering)
- [x] Set up GitHub remote and push repo
- [x] npm postinstall hook for auto-linking on install
- [x] Publish @quigleybits/claude-skills@0.1.0 to npm
