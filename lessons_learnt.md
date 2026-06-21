# custom_claude_skills — lessons learnt

Append-only. Newest entry on top.

---

## 2026-06-21 — shipping debrief v0.2.0 (release-engineering gotchas)

### CRLF silently breaks SKILL.md frontmatter validation
- A prior CRLF-saved edit made `debrief/SKILL.md` fail `npm run validate` with "Missing YAML frontmatter" — even though the file began with `---`. The validator regex was LF-only (`/^---\n/`), so `---\r\n` never matched. `od -c` showed `- - - \r \n` vs recon's `- - - \n`.
- **Rule:** add `.gitattributes` (`* text=auto eol=lf` + per-type) so editor CRLF never reaches a committed file; make parsers CRLF/BOM-tolerant (`/^﻿?---\r?\n/`). Don't trust "it starts with `---`" — check the bytes.

### `files: ["skills/"]` leaked dev-only skills + bytecode into the npm tarball
- `npm pack --dry-run` showed the package shipping all of `skills/handover/` (dev-only, publish-deferred — including uncommitted WIP) plus `__pycache__/*.pyc`. The coarse directory glob in `files` overrode intent.
- **Rule:** use an explicit per-skill `files` allowlist (`skills/recon/`, `skills/debrief/`, …); always `npm pack --dry-run` before publishing and eyeball the list. 17 files/33.7kB → 10/12.3kB after the fix.

### A stale local copy gave false behavioral-test confidence
- A live `/debrief` "test" was actually running `~/.claude/skills/debrief/SKILL.md` — a **plain file dated Mar 27**, not the repo's current version (grep for a current marker = 0). Root cause: `link-skills.mjs` silently *skipped* any non-symlink target, so once a copy landed it froze the live skill on an old version forever. debrief **and** recon were both stale.
- **Rule:** before trusting any behavioral test of a skill, verify the live skill == the repo (it's a junction / grep a unique current string). Fixed the linker to *replace* stale copies, not skip them.

### Bake safety discipline into the skill, not the user's global rules
- The live debrief correctly isolated a concurrent session's WIP via pathspec — but only because the operator's global rule supplied the pathspec; the skill's Phase 3 just said "auto-commit user's work." A published skill can't assume the user has that global config.
- **Rule:** skills must self-contain their safety rules. Added explicit `git add <paths>` + `git commit -- <paths>` (never `git add -A`/bare commit) to debrief Phase 3/6 + behavioral-eval #38.

### "Publish now" was premature — green-but-shallow ≠ tested
- Shipping was recommended on a passing trigger eval + green validation. A single pushback ("is it sufficiently tested?") led to a static audit (3 real defects) and then the stale-copy discovery. None were visible in the green checks.
- **Rule:** for a skill release — (1) static-audit against the behavioral eval, (2) verify the live skill is current, (3) one real behavioral run — *before* publishing. Trigger eval + validate are necessary, not sufficient.
