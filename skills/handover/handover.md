# `/handover` — design and research notes

> Knowledge document for the data-only `/handover` skill. The operational instructions live in [`SKILL.md`](./SKILL.md).
>
> **Status:** the skill writes a curated, redacted continuation brief and reports the reliable `/clear` then `/continue` move. It does not create editor tasks or launch processes.

## 1. The problem

A useful handover must preserve decisions and next actions without copying a raw transcript. The brief also has to survive a session reset before a fresh session reads it.

The workflow has two deliberately separate halves:

1. `/handover` generates a curated Markdown brief in `./.ccb/history/`.
2. `/continue` attaches the newest brief to the fresh session.

`ctx-transfer` is not used because it produces a transcript rather than a concise continuation prompt.

## 2. Ecosystem research

The research compared roughly twenty handoff tools and patterns. Most either generate a file for manual reuse or depend on terminal multiplexers and editor startup hooks. The useful patterns were:

- a purpose-tailored `argument-hint` and suggested-skills section;
- a tight Goal/Status/Files/Decisions/Next/Don't-do schema;
- gather state from Git and project files instead of interrogating the user;
- redact credentials, personal data, and raw conversation logs.

Automatic launch mechanisms were rejected for the public skill. Editor `folderOpen` tasks create an unnecessary execution boundary, while process launchers add platform-specific behavior and make a documentation skill harder to audit.

## 3. Current design

```text
/handover
   |  1. Gather repository and session state
   |  2. Compose a curated, redacted brief
   |  3. Write ./.ccb/history/<utc>-handover.md atomically
   `  4. Report: /clear, then /continue
```

Key decisions:

1. **Data-only skill.** It writes the brief but never starts programs or changes editor configuration.
2. **Atomic save before reset.** A failed or interrupted reset cannot destroy the handover.
3. **Reuse `/continue`.** One existing ingest path is easier to audit than a second launcher protocol.
4. **No raw transcript.** The next session receives decisions and action state, not conversational noise.
5. **Explicit user boundary.** Starting the new session remains a visible user action.

## 4. Brief schema

The skill writes only sections that contain useful information:

- **Goal** — the outcome being pursued;
- **Status** — completed, in-flight, and blocked work;
- **Key decisions (+ why)** — choices the next session should not relitigate;
- **Failed approaches / don't repeat** — tested dead ends;
- **Relevant files** — paths and line references rather than duplicated contents;
- **Next step** — one concrete action;
- **Don't do** — loop and scope guards;
- **Suggested skills** — workflows the next session should invoke.

Every brief must redact API keys, tokens, credentials, personal data, and other sensitive values. `.ccb/` is scratch state and should remain ignored by Git.

## 5. Verification

Security regression tests enforce that:

- no Python launcher exists in the handover skill;
- the skill contains no editor automatic-task instructions;
- current documentation contains no machine-specific user path or internal workflow identifier;
- `npm run validate` continues to accept the skill metadata and body.

## 6. Provenance

- Initial research and prototype: 2026-06-04.
- Security-hardening redesign: 2026-06-27.
- Related skills: [`recon`](../recon/SKILL.md) and [`debrief`](../debrief/SKILL.md).
