# Changelog

All notable changes to `@quigleybits/claude-skills`. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [0.2.0] — 2026-06-22

### Added
- **`/debrief`** — the session-end companion to `/recon`, now part of the public suite. Six ordered phases (assess → triage → commit work → discipline audit → route knowledge → commit & report): it clears loose ends, captures what the session learned across the five engineering disciplines, routes each finding to the right home (`CLAUDE.md` / memory / todo), and commits cleanly. Ships with an 18-case trigger eval and a 38-criterion behavioral eval.

### Fixed
- **Frontmatter validation** now tolerates CRLF line endings and a leading BOM — an LF-only check was silently rejecting valid `SKILL.md` files saved on Windows. Added `.gitattributes` to normalise line endings to LF across the repo.
- **`link-skills` no longer freezes on a stale copy.** A plain (non-symlink) copy at `~/.claude/skills/<skill>` used to be silently skipped, leaving the installed skill stuck on an old version. Non-symlink copies are now replaced with a fresh junction.
- **Packaging tightened.** The npm tarball ships only `recon` + `debrief` via an explicit `files` allowlist — dev-only skills and `__pycache__` bytecode no longer leak in (was 17 files / ~34 kB, now ~10 / ~13 kB).

### debrief safety
- Commits use explicit pathspec (`git add <paths>` + `git commit -- <paths>`) so a debrief can't sweep a concurrent session's uncommitted work.
- Double-debrief guard (skips phases 1–3 when the last commit was already a debrief), clean-workspace handling (no empty commits), and adaptive report sizing.

## [0.1.0]

### Added
- **`/recon`** — full-spectrum project reconnaissance: discovers and reads all docs, cross-references their claims against the actual codebase, audits doc health, runs gap analysis, and presents prioritised next steps.
