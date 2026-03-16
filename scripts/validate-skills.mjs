#!/usr/bin/env node
/**
 * Validates all SKILL.md files in the skills/ directory.
 * Checks: frontmatter format, name/description rules, file structure.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const SKILLS_DIR = resolve(import.meta.dirname, '..', 'skills');
const MAX_NAME_LEN = 64;
const MAX_DESC_LEN = 1024;
const NAME_PATTERN = /^[a-z0-9-]+$/;

let errors = 0;
let warnings = 0;

function error(skill, msg) { console.error(`  ERROR [${skill}]: ${msg}`); errors++; }
function warn(skill, msg) { console.warn(`  WARN  [${skill}]: ${msg}`); warnings++; }
function ok(skill, msg) { console.log(`  OK    [${skill}]: ${msg}`); }

async function validateSkill(skillDir) {
  const name = skillDir.split(/[/\\]/).pop();
  const skillFile = join(skillDir, 'SKILL.md');

  // Check SKILL.md exists
  try {
    await stat(skillFile);
  } catch {
    error(name, 'Missing SKILL.md');
    return;
  }

  const content = await readFile(skillFile, 'utf-8');

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    error(name, 'Missing YAML frontmatter (must start with ---)');
    return;
  }

  const fm = fmMatch[1];
  const nameMatch = fm.match(/^name:\s*(.+)$/m);
  const descMatch = fm.match(/^description:\s*"?(.+?)"?\s*$/m);

  // Validate name
  if (!nameMatch) {
    error(name, 'Missing "name" field in frontmatter');
  } else {
    const skillName = nameMatch[1].trim().replace(/^["']|["']$/g, '');
    if (skillName !== name) {
      error(name, `Name "${skillName}" doesn't match directory "${name}"`);
    }
    if (skillName.length > MAX_NAME_LEN) {
      error(name, `Name exceeds ${MAX_NAME_LEN} chars (${skillName.length})`);
    }
    if (!NAME_PATTERN.test(skillName)) {
      error(name, `Name must be lowercase letters, numbers, hyphens only. Got: "${skillName}"`);
    }
  }

  // Validate description
  if (!descMatch) {
    error(name, 'Missing "description" field in frontmatter');
  } else {
    const desc = descMatch[1].trim();
    if (desc.length > MAX_DESC_LEN) {
      error(name, `Description exceeds ${MAX_DESC_LEN} chars (${desc.length})`);
    }
    if (desc.length === 0) {
      error(name, 'Description is empty');
    }
    if (!desc.startsWith('Use when')) {
      warn(name, 'Description should start with "Use when..." for best CSO');
    }
  }

  // Check content quality
  const body = content.slice(fmMatch[0].length).trim();
  const wordCount = body.split(/\s+/).length;

  if (wordCount > 1500) {
    warn(name, `SKILL.md is ${wordCount} words — consider splitting into supporting files`);
  }

  // Check for XML tags in frontmatter (forbidden)
  if (/<[^>]+>/.test(fm)) {
    error(name, 'Frontmatter contains XML tags (forbidden)');
  }

  ok(name, `Valid (${wordCount} words)`);
}

async function main() {
  console.log('Validating skills...\n');

  let dirs;
  try {
    dirs = await readdir(SKILLS_DIR, { withFileTypes: true });
  } catch {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const skillDirs = dirs.filter(d => d.isDirectory()).map(d => join(SKILLS_DIR, d.name));

  if (skillDirs.length === 0) {
    console.log('No skills found in skills/ directory.');
    process.exit(0);
  }

  for (const dir of skillDirs) {
    await validateSkill(dir);
  }

  console.log(`\nResults: ${skillDirs.length} skills, ${errors} errors, ${warnings} warnings`);
  process.exit(errors > 0 ? 1 : 0);
}

main();
