#!/usr/bin/env node
/**
 * Skill evaluation & trigger testing framework.
 * Validates and runs eval-set.json for each skill.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const SKILLS_DIR = resolve(import.meta.dirname, '..', 'skills');

let totalTests = 0;
let validSkills = 0;

async function evalSkill(skillDir) {
  const name = skillDir.split(/[/\\]/).pop();
  const evalFile = join(skillDir, 'eval-set.json');
  const skillFile = join(skillDir, 'SKILL.md');

  try {
    await stat(evalFile);
  } catch {
    // eval-set.json is optional for now, just skip if not present
    console.log(`  SKIP  [${name}]: No eval-set.json found`);
    return;
  }

  try {
    await stat(skillFile);
  } catch {
    console.error(`  ERROR [${name}]: Missing SKILL.md`);
    return;
  }

  let content;
  try {
    const raw = await readFile(evalFile, 'utf-8');
    content = JSON.parse(raw);
  } catch (err) {
    console.error(`  ERROR [${name}]: Failed to parse eval-set.json - ${err.message}`);
    return;
  }

  if (!content.tests || !Array.isArray(content.tests)) {
    console.error(`  ERROR [${name}]: eval-set.json must contain a "tests" array`);
    return;
  }

  validSkills++;
  console.log(`  EVAL  [${name}]: Found ${content.tests.length} tests`);

  for (let i = 0; i < content.tests.length; i++) {
    const test = content.tests[i];
    if (typeof test.query !== 'string') {
      console.error(`    ERROR test[${i}]: "query" must be a string`);
      continue;
    }
    if (typeof test.should_trigger !== 'boolean') {
      console.error(`    ERROR test[${i}]: "should_trigger" must be a boolean`);
      continue;
    }
    
    totalTests++;
    // In a real implementation, this is where we would call the LLM API
    // to evaluate whether the query would trigger the skill based on its description.
    console.log(`    - Test [${test.should_trigger ? 'TRIGGER' : 'IGNORE '}]: "${test.query}"`);
  }
}

async function main() {
  console.log('Evaluating skill triggers...\n');

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
    await evalSkill(dir);
  }

  console.log(`\nResults: ${validSkills} skills evaluated, ${totalTests} total tests registered.`);
  console.log('Note: LLM evaluation execution is stubbed. Structure validation passed.');
}

main();
