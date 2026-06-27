#!/usr/bin/env node
/**
 * Symlinks skills into ~/.claude/skills/ for Claude Code.
 * Used both for local dev and as npm postinstall/preuninstall hook.
 *
 * Usage:
 *   node scripts/link-skills.mjs          # Link all skills
 *   node scripts/link-skills.mjs --unlink # Remove symlinks
 *   node scripts/link-skills.mjs --quiet  # Suppress non-error output (for postinstall)
 */
import { readdir, symlink, unlink, lstat, readlink, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';

const SKILLS_DIR = resolve(import.meta.dirname, '..', 'skills');
const CLAUDE_SKILLS = resolve(
  process.env.CLAUDE_SKILLS_DIR || join(homedir(), '.claude', 'skills'),
);
const isUnlink = process.argv.includes('--unlink');
const isQuiet = process.argv.includes('--quiet');

function log(msg) { if (!isQuiet) console.log(msg); }

async function main() {
  // Ensure ~/.claude/skills/ exists
  await mkdir(CLAUDE_SKILLS, { recursive: true });

  let dirs;
  try {
    dirs = await readdir(SKILLS_DIR, { withFileTypes: true });
  } catch {
    if (!isQuiet) console.error(`Skills directory not found: ${SKILLS_DIR}`);
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
          log(`Unlinked: ${dir.name}`);
        } else {
          log(`Skipped: ${dir.name} (not our symlink)`);
        }
      } catch {
        log(`Skipped: ${dir.name} (not found)`);
      }
    } else {
      let exists = false;
      try { await lstat(target); exists = true; } catch { /* not present — safe to link */ }

      if (exists) {
        let symlinkTarget = null;
        try { symlinkTarget = await readlink(target); } catch { /* not a symlink */ }

        if (symlinkTarget !== null) {
          const resolvedLinkTarget = resolve(dirname(target), symlinkTarget);
          if (resolvedLinkTarget === resolve(source)) {
            log(`Already linked: ${dir.name}`);
            continue;
          }
          log(`⚠ Skipped: ${dir.name} (symlink points elsewhere: ${symlinkTarget})`);
          continue;
        }
        // A real file or directory belongs to the user. Postinstall must never
        // delete it silently; replacing it requires an explicit manual decision.
        log(`⚠ Skipped: ${dir.name} (existing path is not a symlink)`);
        continue;
      }

      await symlink(source, target, process.platform === 'win32' ? 'junction' : 'dir');
      log(`Linked: ${dir.name} -> ${target}`);
    }
  }
}

main();
