# Repo Setup Summary

## Overview

Git repo at `C:\Users\aidan\git_projects\custom_claude_skills` for developing, testing, and publishing custom Claude Code skills (slash commands). Zero external dependencies — all tooling runs on Node.js built-ins.

## Structure

```
skills/              # One subdirectory per skill, each containing SKILL.md
scripts/             # Dev tools (validate, stats, link)
.claude-plugin/      # Plugin marketplace metadata
docs/                # Project documentation
package.json         # npm publishable as @quigleybits/claude-skills
CLAUDE.md            # Project instructions for Claude Code
LICENSE              # MIT
.gitignore
```

## Dev Tools

| Script | What it does |
|--------|-------------|
| `npm run validate` | Parses every SKILL.md, checks frontmatter rules (name format, description length, directory match), reports errors/warnings |
| `npm run stats` | Shows word count, line count, estimated tokens, section count per skill — for monitoring token budget |
| `npm run link` | Creates Windows junction symlinks from skills/* into ~/.claude/skills/ so Claude Code picks them up immediately |
| `npm run unlink` | Removes those symlinks |

## Workflow — Create / Test / Iterate / Publish

1. **Create** — add `skills/<name>/SKILL.md` with frontmatter + content
2. **Validate** — `npm run validate` catches structural issues before testing
3. **Install locally** — `npm run link` symlinks into `~/.claude/skills/`
4. **Test** — use `/<name>` in Claude Code, verify behavior
5. **Iterate** — edit the file in this repo, changes are live immediately (symlink)
6. **Check budget** — `npm run stats` to ensure token counts stay reasonable
7. **Publish** — two paths:
   - **npm**: `npm publish --access public`
   - **Plugin marketplace**: `.claude-plugin/plugin.json` ready for registration

## Current Skills

- **recon** — Full-spectrum project reconnaissance and doc health audit (975 words, ~1700 tokens, 0 validation errors)

## What Is Not Set Up

- No external dependencies (no npm install needed)
- No test framework (skill testing uses subagent pressure scenarios per superpowers TDD methodology)
- No CI/CD pipeline
- No GitHub remote yet
