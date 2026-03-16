# Vision

## Purpose

This repo creates high-quality, tested Claude Code skills that solve real workflow problems. Every skill goes through iterative self-testing before publishing — run it, evaluate what works, fix what doesn't, repeat.

## Target Audience

Developers and power users who already use Claude Code and want to extend it with reliable slash commands. Not beginners learning Claude — users who know what a CLAUDE.md is and want their agent to do more.

## Quality Bar for Publishing

A skill is ready to publish when:
- It has been tested on at least one real codebase (not just the skill's own repo)
- It passes `npm run validate` with 0 errors and 0 warnings
- It solves a problem that isn't already handled by built-in Claude Code behavior
- The description triggers correctly (doesn't activate when it shouldn't)
- It stays under 1500 words unless complexity genuinely demands more

## What Makes These Skills Different

- **Self-tested** — every skill is run against real projects and refined based on observed behavior, not just written and shipped
- **Compressed** — instructions are tight and minimal, optimized for token efficiency without losing clarity
- **Opinionated** — skills encode specific workflows with clear decision points, not vague guidance
- **Discipline-aware** — skills reference the five documentation disciplines (Prompt Craft, Context Engineering, Intent Engineering, Specification Engineering, Task Engineering) as a shared vocabulary

## Priorities

Depth over breadth. A few excellent skills that reliably produce high-signal output beats a large collection of mediocre ones.
