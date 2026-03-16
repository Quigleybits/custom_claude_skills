#!/usr/bin/env node
/**
 * Symlinks skills from this repo into ~/.claude/skills/ for local testing.
 * Usage:
 *   node scripts/link-skills.mjs          # Link all skills
 *   node scripts/link-skills.mjs --unlink # Remove symlinks
 */
import { readdir, symlink, unlink, stat, readlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const SKILLS_DIR = resolve(import.meta.dirname, '..', 'skills');
const CLAUDE_SKILLS = join(homedir(), '.claude', 'skills');
const isUnlink = process.argv.includes('--unlink');

async function main() {
  let dirs;
  try {
    dirs = await readdir(SKILLS_DIR, { withFileTypes: true });
  } catch {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const skillDirs = dirs.filter(d => d.isDirectory());

  for (const dir of skillDirs) {
    const source = join(SKILLS_DIR, dir.name);
    const target = join(CLAUDE_SKILLS, dir.name);

    if (isUnlink) {
      try {
        const linkTarget = await readlink(target);
        if (resolve(linkTarget) === resolve(source)) {
          await unlink(target);
          console.log(`Unlinked: ${dir.name}`);
        } else {
          console.log(`Skipped: ${dir.name} (not our symlink)`);
        }
      } catch {
        console.log(`Skipped: ${dir.name} (not found)`);
      }
    } else {
      try {
        const existing = await stat(target);
        // Check if it's already a symlink to us
        try {
          const linkTarget = await readlink(target);
          if (resolve(linkTarget) === resolve(source)) {
            console.log(`Already linked: ${dir.name}`);
            continue;
          }
        } catch { /* not a symlink */ }
        console.log(`Skipped: ${dir.name} (already exists at target — remove manually or use a different name)`);
      } catch {
        // Target doesn't exist, safe to link
        await symlink(source, target, 'junction');
        console.log(`Linked: ${dir.name} -> ${target}`);
      }
    }
  }
}

main();
