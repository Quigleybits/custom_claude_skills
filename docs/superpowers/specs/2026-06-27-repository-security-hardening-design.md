# Repository Security Hardening Design

## Goal

Remove unsafe automatic execution and destructive install behavior, prevent automated commits from publishing secrets, and make the public GitHub repository reject unverified changes.

## Design

### Handover

`/handover` remains a data-only skill: it writes a redacted brief and tells the user to run `/clear` followed by `/continue`. The obsolete Python launchers are removed. The skill must not create editor tasks, open processes, or encourage enabling automatic workspace tasks.

### Package installation

`scripts/link-skills.mjs` may create links into the Claude skills directory, but it must never delete or overwrite an existing real file or directory. Existing symlinks that point elsewhere and non-symlink targets are reported and skipped. `CLAUDE_SKILLS_DIR` provides an isolated test target.

### Commit-time secret gate

`skills/debrief/scan-secrets.mjs` scans staged additions before `/debrief` commits. It reports only rule names and locations, never the matching value. It blocks sensitive filenames, private-key markers, provider-token formats, credential URLs, suspicious secret assignments, and high-entropy values. A line can be explicitly reviewed with `secret-scan: allow`; there is no environment-variable bypass.

The same scanner supports `--all` for CI, where it checks tracked text files. `/debrief` must stop and ask the user when the scan fails.

### Continuous verification

The repository gets a pinned GitHub Actions workflow that runs validation, Node tests, Python tests, and the full-tree secret scan. GitHub secret scanning, push protection, vulnerability alerts, automated security updates, and administrator-enforced branch status checks are enabled after the remediation commit reaches `master`.

### Public metadata

Current hard-coded local paths and internal workflow identifiers are removed. New commits use the GitHub noreply address. Existing history is not rewritten because both public forks retain it and a rewrite would require disruptive force-push coordination.

## Testing

- Node regression tests run the real linker in an isolated directory and exercise the real secret scanner in temporary Git repositories.
- Python regression tests assert that the handover skill is data-only and contains no launcher artifacts or automatic-task instructions.
- Existing validation, package dry-run inspection, Semgrep, and historical secret-pattern scans remain release gates.

