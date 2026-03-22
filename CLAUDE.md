# Custom Claude Skills

This repo develops, tests, and publishes custom Claude Code skills (slash commands).

## Project Structure

```
skills/           # Each subdirectory is a skill (contains SKILL.md)
scripts/          # Dev tooling (validate, stats, link, create)
docs/             # Project documentation
.claude-plugin/   # Plugin metadata for Claude marketplace
```

## Commands

- `npm run validate` — Validate all SKILL.md files (frontmatter, naming, structure)
- `npm run stats` — Word counts, token estimates, section counts for all skills
- `npm run link` — Symlink skills into ~/.claude/skills/ for local testing
- `npm run unlink` — Remove symlinks
- `npm run create -- <skill-name> ["description"]` — Scaffold a new skill with valid frontmatter

## Skill Development Workflow

1. Create `skills/<skill-name>/SKILL.md` with proper frontmatter
2. Run `npm run validate` to check structure
3. Run `npm run link` to install locally for testing
4. Test the skill with `/skill-name` in Claude Code
5. Run `npm run stats` to check token budget
6. Commit changes before and after each edit (preserve git history)

## Skill Format Rules

- **name**: lowercase letters, numbers, hyphens only (max 64 chars)
- **description**: starts with "Use when...", max 1024 chars, no workflow summary
- **SKILL.md**: aim for <500 words for frequently-loaded skills
- Directory name must match the `name` field in frontmatter

## Current Skills

- **recon** — Full-spectrum project reconnaissance and doc health audit
- **debrief** — Session-end cleanup, discipline-aware knowledge capture, and documentation routing
