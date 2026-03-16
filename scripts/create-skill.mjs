#!/usr/bin/env node
/**
 * Scaffolds a new skill directory with valid SKILL.md and structure.
 * Usage: npm run create -- <skill-name> ["description"]
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const SKILLS_DIR = resolve(import.meta.dirname, '..', 'skills');
const MAX_NAME_LEN = 64;
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const name = process.argv[2];
const description = process.argv[3] || '';

function die(msg) { console.error(`Error: ${msg}`); process.exit(1); }

if (!name) {
  console.log('Usage: npm run create -- <skill-name> ["Use when..."]');
  console.log('');
  console.log('Examples:');
  console.log('  npm run create -- code-review');
  console.log('  npm run create -- code-review "Use when reviewing PRs or code changes"');
  process.exit(0);
}

// Validate name
if (name.length > MAX_NAME_LEN) die(`Name exceeds ${MAX_NAME_LEN} chars (${name.length})`);
if (!NAME_PATTERN.test(name)) die(`Name must be lowercase letters, numbers, hyphens only. Got: "${name}"`);
if (name.startsWith('-') || name.endsWith('-')) die('Name cannot start or end with a hyphen');

// Check if already exists
const skillDir = join(SKILLS_DIR, name);
try {
  await stat(skillDir);
  die(`Skill "${name}" already exists at ${skillDir}`);
} catch { /* good, doesn't exist */ }

// Build SKILL.md content
const descLine = description
  ? `"${description}"`
  : `"Use when [describe triggering conditions here]"`;

const skillContent = `---
name: ${name}
description: ${descLine}
---

# ${name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}

[Core principle in 1-2 sentences. What is this skill and why does it exist?]

## Execution Flow

[How the skill works — steps, phases, or decision flow]

## Common Mistakes

- **[Mistake]** — [Why it's wrong and what to do instead]
`;

// Create directory and files
await mkdir(skillDir, { recursive: true });
await writeFile(join(skillDir, 'SKILL.md'), skillContent, 'utf-8');

console.log(`Created: skills/${name}/SKILL.md`);

// Run validation
console.log('\nValidating...');
try {
  execSync('node scripts/validate-skills.mjs', {
    cwd: resolve(import.meta.dirname, '..'),
    stdio: 'inherit'
  });
} catch {
  // validation output already printed
}
