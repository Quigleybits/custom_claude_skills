#!/usr/bin/env node
// Tiny zero-dep installer for the Claude Code `handoff` skill.
//
// Subcommands:
//   install     copy skill/SKILL.md → <skills-dir>/handoff/SKILL.md  (default)
//   update      same as `install --force`
//   uninstall   remove <skills-dir>/handoff/
//   --help      print usage
//
// The target skills directory defaults to ~/.claude/skills, but can be
// overridden with $CLAUDE_SKILLS_DIR (e.g. to install at project level).

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import {
    existsSync,
    mkdirSync,
    copyFileSync,
    rmSync,
    readFileSync,
} from 'node:fs';

const SKILL_NAME = 'handoff';
const SKILL_FILE = 'SKILL.md';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = dirname(__dirname);
const SOURCE_FILE = join(PACKAGE_ROOT, 'skill', SKILL_FILE);

const PKG_VERSION = (() => {
    try {
        const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
        return pkg.version;
    } catch {
        return 'unknown';
    }
})();

const DEFAULT_SKILLS_DIR = join(homedir(), '.claude', 'skills');
const SKILLS_DIR = process.env.CLAUDE_SKILLS_DIR || DEFAULT_SKILLS_DIR;
const TARGET_DIR = join(SKILLS_DIR, SKILL_NAME);
const TARGET_FILE = join(TARGET_DIR, SKILL_FILE);

const COLOR = process.stdout.isTTY ? {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
} : { reset: '', green: '', yellow: '', red: '', dim: '', bold: '' };

const log = {
    info: (m) => console.log(`${COLOR.dim}·${COLOR.reset} ${m}`),
    ok: (m) => console.log(`${COLOR.green}✓${COLOR.reset} ${m}`),
    warn: (m) => console.warn(`${COLOR.yellow}!${COLOR.reset} ${m}`),
    err: (m) => console.error(`${COLOR.red}✗${COLOR.reset} ${m}`),
};

function printHelp() {
    console.log(`claude-handoff-skill v${PKG_VERSION}

Install the "handoff" Claude Code skill.

USAGE
  npx claude-handoff-skill [command] [options]

COMMANDS
  install      Copy the skill into ${COLOR.bold}${SKILLS_DIR}/${SKILL_NAME}${COLOR.reset} (default)
  update       Reinstall over an existing copy
  uninstall    Remove the installed skill
  --help, -h   Show this help

OPTIONS
  --force, -f  Overwrite an existing install (implied by 'update')

ENVIRONMENT
  CLAUDE_SKILLS_DIR  Override the skills directory.
                     Default: ${DEFAULT_SKILLS_DIR}

EXAMPLES
  npx claude-handoff-skill install
  npx claude-handoff-skill update
  npx claude-handoff-skill uninstall
  CLAUDE_SKILLS_DIR=./.claude/skills npx claude-handoff-skill install
`);
}

function install({ force }) {
    if (!existsSync(SOURCE_FILE)) {
        log.err(`Source SKILL.md not found at ${SOURCE_FILE}`);
        log.err('This is a packaging bug — please report it.');
        process.exit(2);
    }

    mkdirSync(TARGET_DIR, { recursive: true });

    if (existsSync(TARGET_FILE) && !force) {
        log.warn(`A handoff skill is already installed at:`);
        log.warn(`  ${TARGET_FILE}`);
        log.warn(`Use \`npx claude-handoff-skill update\` to overwrite.`);
        process.exit(1);
    }

    copyFileSync(SOURCE_FILE, TARGET_FILE);

    log.ok(`Installed handoff skill → ${TARGET_FILE}`);
    log.info(`Restart Claude Code (start a new session) for the skill to register.`);
    log.info(`Then trigger it with /handoff or "session handoff".`);
}

function uninstall() {
    if (!existsSync(TARGET_DIR)) {
        log.warn(`Nothing to remove — ${TARGET_DIR} doesn't exist.`);
        return;
    }
    rmSync(TARGET_DIR, { recursive: true, force: true });
    log.ok(`Removed ${TARGET_DIR}`);
}

function main() {
    const args = process.argv.slice(2);
    const positional = args.filter((a) => !a.startsWith('-'));
    const flags = new Set(args.filter((a) => a.startsWith('-')));

    if (flags.has('--help') || flags.has('-h')) {
        printHelp();
        return;
    }

    const command = positional[0] || 'install';
    const force = flags.has('--force') || flags.has('-f');

    switch (command) {
        case 'install':
            install({ force });
            break;
        case 'update':
            install({ force: true });
            break;
        case 'uninstall':
        case 'remove':
            uninstall();
            break;
        default:
            log.err(`Unknown command: ${command}`);
            printHelp();
            process.exit(64);
    }
}

main();
