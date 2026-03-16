# Skill Specification

Authoritative reference for the SKILL.md format used in this repo. CLAUDE.md and the validate script both follow these rules.

## Directory Structure

```
skills/
  skill-name/
    SKILL.md              # Required — main skill definition
    supporting-file.*     # Optional — heavy reference, scripts, templates
```

Directory name must match the `name` field in SKILL.md frontmatter.

## Frontmatter (YAML)

Two fields, both required:

```yaml
---
name: skill-name
description: "Use when [triggering conditions]"
---
```

### name
- Lowercase letters, numbers, hyphens only
- Max 64 characters
- Must match the directory name
- No XML tags, no special characters
- Prefer gerund form: `debugging-apis` not `api-debugger`

### description
- Max 1024 characters
- Must start with "Use when..."
- Describes triggering conditions only — never summarize the workflow
- Third person (injected into system prompt)
- No XML tags

## Content

### Token Budget
- Frequently-loaded skills: aim for <500 words
- On-demand skills (like recon): up to 1500 words
- Beyond 1500: split into SKILL.md + supporting files

### Structure
A skill should include:
- Overview (1-2 sentences, core principle)
- Execution flow (steps, phases, or decision flow)
- Common mistakes (what goes wrong and why)

Optional:
- Flowchart (only for non-obvious decision points)
- Quick reference table
- Code examples (one excellent example, not multi-language)

### Discipline Categories
Files scanned by skills like `/recon` are categorized into five disciplines:

| Discipline | What it is |
|------------|------------|
| **Prompt Craft** | Direct agent instructions: guardrails, examples, output format |
| **Context Engineering** | The information environment agents operate in |
| **Intent Engineering** | What agents should want: purpose, trade-offs, decision boundaries |
| **Specification Engineering** | Agent-executable documents with acceptance criteria |
| **Task Engineering** | Independently executable work units and progress tracking |

## Validation

Run `npm run validate` to check all skills. Checks:
- Frontmatter exists and is valid YAML
- Name matches directory, follows naming rules, within length limit
- Description exists, within length limit
- No XML tags in frontmatter
- Word count warning at 1500+
