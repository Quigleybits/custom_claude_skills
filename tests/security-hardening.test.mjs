import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LINK_SCRIPT = join(REPO_ROOT, 'scripts', 'link-skills.mjs');
const SECRET_SCANNER = join(REPO_ROOT, 'skills', 'debrief', 'scan-secrets.mjs');

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? REPO_ROOT,
    encoding: 'utf8',
    env: options.env ?? process.env,
  });
}

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'claude-skills-security-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function initGitRepo(dir) {
  assert.equal(run('git', ['init', '--quiet'], { cwd: dir }).status, 0);
  assert.equal(run('git', ['config', 'user.name', 'Security Test'], { cwd: dir }).status, 0);
  assert.equal(
    run('git', ['config', 'user.email', 'security-test@invalid.example'], { cwd: dir }).status,
    0,
  );
}

test('linker preserves an existing real skill directory', () =>
  withTempDir((home) => {
    const source = readFileSync(LINK_SCRIPT, 'utf8');
    assert.match(source, /process\.env\.CLAUDE_SKILLS_DIR/);
    assert.doesNotMatch(source, /\brm\(target,/);

    const targetRoot = join(home, 'skills');
    const existing = join(targetRoot, 'recon');
    mkdirSync(existing, { recursive: true });
    writeFileSync(join(existing, 'owned-by-user.txt'), 'keep me\n');

    const env = { ...process.env, CLAUDE_SKILLS_DIR: targetRoot };
    const result = run(process.execPath, [LINK_SCRIPT, '--quiet'], { env });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(existing, 'owned-by-user.txt'), 'utf8'), 'keep me\n');

    const unlink = run(process.execPath, [LINK_SCRIPT, '--unlink', '--quiet'], { env });
    assert.equal(unlink.status, 0, unlink.stderr);
  }));

test('staged secret scan blocks sensitive files without echoing values', () =>
  withTempDir((dir) => {
    initGitRepo(dir);
    const fakeToken = `gh${'p_'}${'A'.repeat(40)}`;
    writeFileSync(join(dir, '.env'), `${fakeToken}\n`);
    assert.equal(run('git', ['add', '.env'], { cwd: dir }).status, 0);

    const result = run(process.execPath, [SECRET_SCANNER], { cwd: dir });
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(result.stderr, /sensitive filename/i);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(fakeToken));
  }));

test('staged secret scan allows ordinary source changes', () =>
  withTempDir((dir) => {
    initGitRepo(dir);
    writeFileSync(join(dir, 'safe.js'), "export const greeting = 'hello';\n");
    assert.equal(run('git', ['add', 'safe.js'], { cwd: dir }).status, 0);

    const result = run(process.execPath, [SECRET_SCANNER], { cwd: dir });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /no secrets detected/i);
  }));

test('staged secret scan blocks suspicious assignments and supports reviewed lines', () =>
  withTempDir((dir) => {
    initGitRepo(dir);
    const fakeSecret = `${'Ab3_'.repeat(10)}Z9`;
    writeFileSync(join(dir, 'config.js'), `export const api_key = '${fakeSecret}';\n`);
    assert.equal(run('git', ['add', 'config.js'], { cwd: dir }).status, 0);

    const blocked = run(process.execPath, [SECRET_SCANNER], { cwd: dir });
    assert.equal(blocked.status, 1, blocked.stderr || blocked.stdout);
    assert.match(blocked.stderr, /suspicious secret assignment/i);
    assert.doesNotMatch(`${blocked.stdout}${blocked.stderr}`, new RegExp(fakeSecret));

    writeFileSync(
      join(dir, 'config.js'),
      `export const api_key = '${fakeSecret}'; // secret-scan: allow\n`,
    );
    assert.equal(run('git', ['add', 'config.js'], { cwd: dir }).status, 0);
    const allowed = run(process.execPath, [SECRET_SCANNER], { cwd: dir });
    assert.equal(allowed.status, 0, allowed.stderr || allowed.stdout);
  }));

test('full scan reads the Git index instead of an unstaged worktree replacement', () =>
  withTempDir((dir) => {
    initGitRepo(dir);
    const fakeSecret = `${'Q7x_'.repeat(10)}K2`;
    writeFileSync(join(dir, 'tracked.js'), `export const client_secret = '${fakeSecret}';\n`);
    assert.equal(run('git', ['add', 'tracked.js'], { cwd: dir }).status, 0);
    assert.equal(run('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: dir }).status, 0);

    writeFileSync(join(dir, 'tracked.js'), "export const message = 'safe worktree';\n");
    const result = run(process.execPath, [SECRET_SCANNER, '--all'], { cwd: dir });
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(result.stderr, /suspicious secret assignment/i);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(fakeSecret));
  }));
