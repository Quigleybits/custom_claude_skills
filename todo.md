# Todo

## Soon
- [ ] Retest updated `/debrief` on real project — include staged-secret gate; use `skills/debrief/behavioral-eval.md` v2 (39 criteria)
- [ ] Build `/roe` skill — rules of engagement, delegation boundary mapper + domain-specific failure patterns (see `docs/skill-ideas.md`)
- [ ] Recon v0.2 — fold in intent completeness checking + context fragmentation detection
- [ ] Build `/zero` skill — zero the harness, holistic Claude Code setup health check
- [ ] Build `/doctrine` skill — encode lessons into law, constraint library with PreCompact hook auto-trigger (see `docs/skill-ideas.md`)
- [ ] Decide whether the data-only `/handover` ships in the public package or stays dev-only. If shipping: add it to README, `.claude-plugin/plugin.json`, and `docs/skill-comparison.md`.

## Later
- [ ] Cross-platform export script (`npm run export -- --target cursor,codex,aider`) — converts SKILL.md to other AI tool formats
- [ ] Watch mode for live dev (auto-sync on file change)
- [ ] Token budget planner (select which skills fit within a budget)
- [ ] Skill conflict detection (find contradictions between skills)
- [ ] Selective skill installer CLI (`npx @quigleybits/claude-skills install recon`) — lets users pick individual skills instead of installing all

## Done
- [x] Publish @quigleybits/claude-skills@0.2.1 security release (2026-06-28)
- [x] Harden public repository (2026-06-27) — secret-scanning CI, staged `/debrief` gate, non-destructive postinstall linking, data-only handover, and GitHub protection settings.
- [x] Build `/handover` skill (2026-06-04; security redesign 2026-06-27) — curated continuation brief → `./.ccb/history/` (newest-wins) → explicit `/clear` + `/continue`. No process launch, editor task, or raw transcript. Writeup: `skills/handover/handover.md`. Publish decision deferred (see Soon).
- [x] Debrief v1 tested + 7 optimizations applied (2026-03-26) — concrete checklist, conditional lenses, durability routing, tool call budget, lint fallback, todo fallback, MEMORY.md bootstrap. Behavioral eval v2 (39 criteria).
- [x] Trigger eval completed (2026-03-26) — 36/36 pass (Opus inline evaluation, both skills). Haiku API eval optional for dev.
- [x] Added `docs/decisions.md` — 5 design trade-off rules filling Intent Engineering gap.
- [x] Build `/debrief` skill — 6-phase session-end workflow: assess, triage, commit work, discipline audit, route knowledge, commit & report. Design spec, implementation plan, SKILL.md (1108 words), eval-set.json (18 tests). Linked and validated.
- [x] Skill evaluation & trigger testing framework — `eval-set.json` + `scripts/eval-skills.mjs` with Anthropic API integration, 18 test cases for recon, `--dry-run` mode
- [x] Fix stale `~/.claude/skills/recon` copy — replaced with proper symlink to repo
- [x] Skill ideas research — analyzed 19 AI strategy transcripts, distilled 4 prioritized skill candidates (`docs/skill-ideas.md`)
- [x] CC feature requests doc — `docs/cc-feature-requests.md` for tracking desired Claude Code capabilities
- [x] Build skill scaffolding command (`npm run create -- <skill-name>`)
- [x] Refine recon category definitions (Prompt Craft/Context/Intent/Specification/Task Engineering)
- [x] Set up GitHub remote and push repo
- [x] npm postinstall hook for auto-linking on install
- [x] Publish @quigleybits/claude-skills@0.1.0 to npm
