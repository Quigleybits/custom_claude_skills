#!/usr/bin/env node
/**
 * Shows word counts, token estimates, and structure for all skills.
 * Helps monitor token budget compliance.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const SKILLS_DIR = resolve(import.meta.dirname, '..', 'skills');

async function getSkillStats(skillDir) {
  const name = skillDir.split(/[/\\]/).pop();
  const skillFile = join(skillDir, 'SKILL.md');

  try {
    await stat(skillFile);
  } catch {
    return { name, error: 'Missing SKILL.md' };
  }

  const content = await readFile(skillFile, 'utf-8');
  const lines = content.split('\n').length;
  const words = content.split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  const estimatedTokens = Math.ceil(chars / 4); // rough estimate

  // Count sections
  const headings = content.match(/^#{1,3} .+$/gm) || [];

  // List supporting files
  const allFiles = await readdir(skillDir, { withFileTypes: true });
  const supportFiles = allFiles
    .filter(f => f.isFile() && f.name !== 'SKILL.md')
    .map(f => f.name);

  return { name, lines, words, chars, estimatedTokens, headings: headings.length, supportFiles };
}

async function main() {
  let dirs;
  try {
    dirs = await readdir(SKILLS_DIR, { withFileTypes: true });
  } catch {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const skillDirs = dirs.filter(d => d.isDirectory()).map(d => join(SKILLS_DIR, d.name));
  const stats = await Promise.all(skillDirs.map(getSkillStats));

  console.log('Skill Statistics\n');
  console.log('Name'.padEnd(30) + 'Words'.padStart(8) + 'Lines'.padStart(8) + 'Tokens~'.padStart(10) + '  Sections  Extra Files');
  console.log('-'.repeat(90));

  let totalWords = 0;
  let totalTokens = 0;

  for (const s of stats) {
    if (s.error) {
      console.log(`${s.name.padEnd(30)} ${s.error}`);
      continue;
    }
    totalWords += s.words;
    totalTokens += s.estimatedTokens;
    const extra = s.supportFiles.length > 0 ? s.supportFiles.join(', ') : '-';
    console.log(
      `${s.name.padEnd(30)}${String(s.words).padStart(8)}${String(s.lines).padStart(8)}${String(s.estimatedTokens).padStart(10)}  ${String(s.headings).padStart(8)}  ${extra}`
    );
  }

  console.log('-'.repeat(90));
  console.log(`${'TOTAL'.padEnd(30)}${String(totalWords).padStart(8)}${' '.repeat(8)}${String(totalTokens).padStart(10)}`);
  console.log(`\nNote: Token estimates are ~chars/4 (rough). Actual tokenization varies.`);
}

main();
