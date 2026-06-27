#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';

const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const ALLOW_MARKER = 'secret-scan: allow';

const RULES = [
  {
    name: 'private key marker',
    pattern: /-----BEGIN (?:RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY-----/i, // secret-scan: allow
  },
  {
    name: 'GitHub token',
    pattern: /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/,
  },
  { name: 'Anthropic API key', pattern: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'OpenAI API key', pattern: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: 'AWS access key', pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/ },
  { name: 'Google API key', pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Slack token', pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'npm token', pattern: /npm_[A-Za-z0-9]{30,}/ },
  { name: 'Stripe live secret', pattern: /(?:sk|rk)_live_[A-Za-z0-9]{16,}/ },
  {
    name: 'JWT-like token',
    pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  },
  {
    name: 'credential-bearing URL',
    pattern: /[a-z][a-z0-9+.-]{2,}:\/\/[^\s/:]+:[^\s/@]+@/i,
  },
  {
    name: 'suspicious secret assignment',
    pattern:
      /\b(?:api[_-]?key|client[_-]?secret|secret|password|passwd|access[_-]?token|auth[_-]?token|private[_-]?key)\b\s*[:=]\s*["'`]?(?!\$\{|process\.env|os\.environ|getenv|<|\[|\{)[A-Za-z0-9_+./=-]{12,}/i,
  },
];

const HIGH_ENTROPY_PATTERN = /(?<![A-Za-z0-9])([A-Za-z0-9+/_=-]{32,})(?![A-Za-z0-9])/g;
const PUBLIC_DIGEST_CONTEXT = /\b(?:sha(?:1|256|512)?|checksum|integrity|commit hash|object id|keyid|signature)\b/i;

function git(args, encoding = 'utf8') {
  return execFileSync('git', args, {
    encoding,
    maxBuffer: 20 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function nulPaths(output) {
  return output.toString('utf8').split('\0').filter(Boolean);
}

function stagedPaths() {
  return nulPaths(git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], null));
}

function trackedPaths() {
  return nulPaths(git(['ls-files', '-z'], null));
}

function indexContent(path) {
  return git(['show', `:${path}`], null);
}

function sensitiveFilename(path) {
  const name = basename(path).toLowerCase();
  if (/^\.env(?:\.|$)/.test(name) && !/^\.env\.(?:example|sample|template)$/.test(name)) {
    return true;
  }
  if (/\.(?:pem|key|p12|pfx|kdbx|jks)$/.test(name)) return true;
  return /^(?:\.npmrc|\.netrc|credentials|credentials\.json|id_rsa|id_ed25519)$/.test(name);
}

function shannonEntropy(value) {
  const counts = new Map();
  for (const char of value) counts.set(char, (counts.get(char) || 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

function lineFindings(path, line, lineNumber) {
  if (line.toLowerCase().includes(ALLOW_MARKER)) return [];

  const findings = [];
  for (const rule of RULES) {
    if (rule.pattern.test(line)) findings.push({ path, line: lineNumber, rule: rule.name });
  }

  if (!PUBLIC_DIGEST_CONTEXT.test(line)) {
    HIGH_ENTROPY_PATTERN.lastIndex = 0;
    for (const match of line.matchAll(HIGH_ENTROPY_PATTERN)) {
      const candidate = match[1];
      if (shannonEntropy(candidate) >= 4.3) {
        findings.push({ path, line: lineNumber, rule: 'high-entropy value' });
        break;
      }
    }
  }
  return findings;
}

function scanFile(path, content) {
  const findings = [];
  if (sensitiveFilename(path)) findings.push({ path, line: 1, rule: 'sensitive filename' });
  if (content === null || content.includes(0)) return findings;
  if (content.length > MAX_TEXT_BYTES) {
    findings.push({ path, line: 1, rule: 'text file exceeds scan limit' });
    return findings;
  }

  const lines = content.toString('utf8').split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    findings.push(...lineFindings(path, lines[index], index + 1));
  }
  return findings;
}

function main() {
  const mode = process.argv.includes('--all') ? 'all' : 'staged';
  const invalidArgs = process.argv.slice(2).filter((arg) => !['--all', '--staged'].includes(arg));
  if (invalidArgs.length > 0) {
    console.error(`Unknown option: ${invalidArgs[0]}`);
    return 2;
  }

  let paths;
  try {
    paths = mode === 'all' ? trackedPaths() : stagedPaths();
  } catch {
    console.error('Secret scan failed: run this command inside a Git repository.');
    return 2;
  }

  const findings = [];
  for (const path of paths) {
    try {
      const content = indexContent(path);
      findings.push(...scanFile(path, content));
    } catch {
      findings.push({ path, line: 1, rule: 'file could not be scanned' });
    }
  }

  const unique = [...new Map(findings.map((item) => [`${item.path}:${item.line}:${item.rule}`, item])).values()];
  if (unique.length > 0) {
    console.error(`Secret scan blocked ${unique.length} finding(s):`);
    for (const finding of unique) {
      console.error(`- ${finding.path}:${finding.line} [${finding.rule}]`);
    }
    console.error(`Review each finding. Add "${ALLOW_MARKER}" only after confirming the value is public.`);
    return 1;
  }

  console.log(`Secret scan: no secrets detected (${paths.length} ${mode} file(s)).`);
  return 0;
}

process.exitCode = main();
