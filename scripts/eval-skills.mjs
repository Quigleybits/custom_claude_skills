#!/usr/bin/env node
/**
 * Skill trigger evaluation framework.
 * Tests whether skill descriptions correctly trigger for intended queries
 * by calling the Anthropic API to simulate Claude Code's skill routing.
 *
 * Usage:
 *   npm run eval              # Full LLM evaluation (requires ANTHROPIC_API_KEY)
 *   npm run eval -- --dry-run # Structure validation only, no API calls
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const SKILLS_DIR = resolve(import.meta.dirname, '..', 'skills');
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const dryRun = process.argv.includes('--dry-run');

const results = { pass: 0, fail: 0, error: 0, skip: 0 };

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    if (key) fm[key] = val;
  }
  return fm;
}

async function callLLM(skillName, skillDescription, query) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16,
      system: [
        'You are Claude Code\'s skill routing system.',
        'You decide whether a user message should invoke a specific skill.',
        '',
        `Skill: "${skillName}"`,
        `Description: "${skillDescription}"`,
        '',
        'Answer YES if the message matches the triggering conditions in the description.',
        'Answer NO if it does not.',
        'Reply with only YES or NO.',
      ].join('\n'),
      messages: [{ role: 'user', content: query }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const answer = data.content[0].text.trim().toUpperCase();
  return answer.startsWith('YES');
}

async function evalSkill(skillDir) {
  const name = skillDir.split(/[/\\]/).pop();
  const evalFile = join(skillDir, 'eval-set.json');
  const skillFile = join(skillDir, 'SKILL.md');

  try { await stat(evalFile); } catch {
    console.log(`  SKIP  ${name}: no eval-set.json`);
    results.skip++;
    return;
  }

  let frontmatter;
  try {
    const raw = await readFile(skillFile, 'utf-8');
    frontmatter = parseFrontmatter(raw);
    if (!frontmatter?.name || !frontmatter?.description) {
      throw new Error('Missing name or description in frontmatter');
    }
  } catch (err) {
    console.error(`  ERROR ${name}: ${err.message}`);
    results.error++;
    return;
  }

  let tests;
  try {
    const raw = await readFile(evalFile, 'utf-8');
    const content = JSON.parse(raw);
    if (!Array.isArray(content.tests)) throw new Error('"tests" must be an array');
    tests = content.tests;
  } catch (err) {
    console.error(`  ERROR ${name}: eval-set.json — ${err.message}`);
    results.error++;
    return;
  }

  console.log(`\n  ${name} (${tests.length} tests)`);
  console.log(`  description: ${frontmatter.description}\n`);

  for (let i = 0; i < tests.length; i++) {
    const { query, should_trigger } = tests[i];
    if (typeof query !== 'string' || typeof should_trigger !== 'boolean') {
      console.error(`    ERROR  test[${i}]: invalid format`);
      results.error++;
      continue;
    }

    const expect = should_trigger ? 'TRIGGER' : 'IGNORE';

    if (dryRun) {
      console.log(`    --     [${expect}] "${query}"`);
      results.skip++;
      continue;
    }

    try {
      const triggered = await callLLM(frontmatter.name, frontmatter.description, query);
      const passed = triggered === should_trigger;
      const actual = triggered ? 'TRIGGER' : 'IGNORE';

      if (passed) {
        console.log(`    PASS   [${expect}] "${query}"`);
        results.pass++;
      } else {
        console.log(`    FAIL   [${expect}] "${query}" → LLM said ${actual}`);
        results.fail++;
      }
    } catch (err) {
      console.error(`    ERROR  "${query}" — ${err.message}`);
      results.error++;
    }
  }
}

async function main() {
  console.log(`Skill Trigger Evaluation${dryRun ? ' (dry run)' : ''}\n`);

  if (!dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set.');
    console.error('Run with --dry-run for structure validation only.');
    process.exit(1);
  }

  let dirs;
  try {
    dirs = await readdir(SKILLS_DIR, { withFileTypes: true });
  } catch {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const skillDirs = dirs.filter(d => d.isDirectory()).map(d => join(SKILLS_DIR, d.name));

  if (skillDirs.length === 0) {
    console.log('No skills found.');
    process.exit(0);
  }

  for (const dir of skillDirs) {
    await evalSkill(dir);
  }

  console.log('\n' + '-'.repeat(50));
  console.log(`Results: ${results.pass} pass, ${results.fail} fail, ${results.error} error, ${results.skip} skip`);

  if (results.fail > 0) process.exit(1);
  if (results.error > 0) process.exit(2);
}

main();
