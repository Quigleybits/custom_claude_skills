# `/handover` — design, research & build notes

> Knowledge doc for the `/handover` skill. Captures the original ask, the ecosystem research,
> the design decisions, the build, how it was verified, and the open follow-ups.
> The operational skill itself lives next to this file: [`SKILL.md`](./SKILL.md) + [`handover_send.py`](./handover_send.py).
>
> **Status:** built + pilot-verified in *direct* mode (2026-06-04). The CCB-*paned* auto-reset path is implemented but unverified (no live `claude` pane to test against yet).

---

## 1. The ask

> "A `/handover` skill: type `/handover`, it creates a continuation **prompt** and **sends it to a new session** to continue the work — maybe one exists on GitHub?"

Two halves:

1. **Generate** a curated continuation prompt (work done, decisions, state, next steps) — *not* a transcript dump.
2. **Send** it into a **new** Claude Code session so work continues with full context.

Constraints that shaped everything: **Windows 11 + PowerShell**, and the user already runs **CCB** (the `codex-dual` bridge) with a partial handover loop in place.

---

## 2. What already existed locally (the CCB stack)

The user was ~80% there before we started. CCB already provides:

| Piece | What it does | Role in handover |
|---|---|---|
| `ctx-transfer` (CLI) | Dumps the last N conversation pairs from the session JSONL; `--output <file>` or `--send` to a provider | **Raw transcript dump** — deliberately *not* used by `/handover` |
| `/continue` (skill) | Attaches the **newest** `./.ccb/history/*.md` into the session via an `@file` line | **Ingest half** — reused as-is |
| `/autonew <provider>` (skill → `autonew` bin) | Sends `/new` to a provider's registered pane via `backend.send_text(pane_id, "/new")` | Fresh-session launch (paned mode) |
| `/debrief` + `/recon` | Session-end / session-start bookends | Composes with `/handover` |
| `pane_registry.py` / `terminal.py` / `project_id.py` (CCB lib) | Pane registry + terminal backend (`send_text`, `is_alive`) keyed by a computed project id | The mechanism `/handover`'s auto-chain rides |

So the **only genuinely missing piece** was a *curated-prompt generator* glued to the launch/ingest pieces. That is exactly what `/handover` adds — nothing more.

---

## 3. Ecosystem research (do we need to build at all?)

Ran a 4-scout + synthesis workflow (run `wf_10b9d666-ab6`) across GitHub (`gh` search), curated skill collections, plugin marketplaces, and the open web (Tavily). ~30 candidates, deduped to ~20 distinct verified tools. Source files were read to confirm behaviour, not trusted from titles.

### Verdict

**No perfect, drop-in `/handover` exists for this exact ask on Windows.** Exactly two *live* tools do **both** halves (curated prompt **and** into a new session), and both are macOS/Linux-shaped:

| Tool | Fit | Both halves? | Windows snag |
|---|---|---|---|
| [pchalasani/claude-code-tools](https://github.com/pchalasani/claude-code-tools) — `>handoff`/`aichat resume` | 82 | ✅ `build_rollover_prompt()` → `claude -p` spawn → `claude --resume` | tmux + uv + clipboard trigger; the `claude -p` core is OS-agnostic though |
| [qdhenry/Claude-Command-Suite](https://github.com/qdhenry/Claude-Command-Suite/blob/main/.claude/commands/session/handoff-continue.md) — `/session:handoff-continue` (1.3k★) | 66 | ✅ structured handoff → auto-spawn | uses **Zellij**; **hardcoded mac claude path** |
| [thepushkarp/handoff](https://github.com/thepushkarp/handoff) | 58 | ⚠️ curated doc + SessionStart hook auto-**injects** (doesn't launch) | best Windows fit — pure bash hooks via Git Bash |
| [vmihalis/claude-handover](https://github.com/vmihalis/claude-handover/blob/main/skills/handover/SKILL.md) — `/handover` + `/pickup` | 40 | ❌ file-only, manual `/pickup` | clean, zero-dep; best **schema template** (Goal/Status/Files/Decisions/Blockers/Next/"Don't do") |
| [scottconverse/claude-code-handoff-cowork](https://github.com/scottconverse/claude-code-handoff-cowork) | 46 | ⚠️ auto-inject, no launch | Windows-hardened (Perl/mkdir shims) |

Everything else (incl. 2.2k★ pro-workflow, 1.9k★ softaworks, wshobson, davila7, mattpocock) is **generate-only → manual re-attach**, or **auto-inject via SessionStart hook but does not launch**. The tmux-pane senders (daystar7777, butler-skill-kit, steviepee/relay) need a pre-parked pane + tmux — wrong shape for Windows. One repo reported to nail it (`danielrosehill/Claude-Handover`) is now a **404** — treat as dead.

**Conclusion:** adapting a tmux/Zellij tool to Windows is more work and more brittle than building a thin skill on the CCB stack the user already owns. → **Build.**

---

## 4. Reference material we kept (and what we borrowed)

Two references are kept for provenance under [`docs/handover-research/`](../../docs/handover-research/) — deliberately **outside** the skill dir. (`npm run link` junctions the whole `skills/handover/` into `~/.claude/skills/handover/`; a tarball and a nested `SKILL.md` would otherwise deploy with the skill and risk a phantom `handoff` skill being discovered.)

- **`docs/handover-research/package/` + `claude-handoff-skill-1.0.0.tgz`** — the npm package [`claude-handoff-skill@1.0.0`](https://www.npmjs.com/package/claude-handoff-skill) (3rd-party, MIT). Pattern: `/handoff` → renders a **5-section** prompt in one fenced markdown block; user **copies + pastes** it as the next session's opening prompt (clipboard pattern, **no auto-send**). Installs its `SKILL.md` to `~/.claude/skills/handoff/` via `npx claude-handoff-skill install`. Moved out of `skills/handover/` to `docs/handover-research/` in the 2026-06-04 cleanup; **reference only**, not our skill.
- **[mattpocock/skills `/handoff`](https://github.com/mattpocock/skills/blob/main/skills/productivity/handoff/SKILL.md)** — minimal: writes a handoff doc to the OS temp dir, no send.

**Ideas borrowed into our schema:**

| From | Idea |
|---|---|
| mattpocock | `argument-hint: "what the next session focuses on"` (purpose-tailored doc); a **"suggested skills"** section; *reference artifacts by path, don't duplicate*; **redact secrets** |
| vmihalis | tight section schema + the **"Don't do"** anti-loop guard |
| claude-handoff-skill / qdhenry | "**gather state, don't ask**" (git status, commits, todos); a **Quick-start commands** block; explicit Next-steps ordering |

---

## 5. Design

### Principle: add only the missing half, reuse the rest

```
/handover
   |  (1) Claude composes a curated handover PROMPT  <- the only new capability
   |  (2) atomic-write -> ./.ccb/history/<utc>-handover.md   (newest-wins)
   v  (3) mode-aware send  ->  handover_send.py
        |- CCB-paned mode:  autonew claude (/new)  ->  push /continue   -> one step
        `- direct mode:     print @<path>  +  "/clear then /continue"   -> two keys
                                   |
                                   v
                       /continue  (existing skill, untouched)
                       attaches newest ./.ccb/history/*.md via @file
```

### Key decisions

1. **Reuse `/continue` for ingestion.** `/handover` writes the curated doc as the *newest* file in `./.ccb/history/` — the exact dir+contract `/continue` already reads. Zero new ingest code, no collision with `ctx-transfer` (newest-wins).
2. **Do not use `ctx-transfer` to send.** It's a raw transcript dump — the precise thing the ask says to avoid. Claude composes the curated prompt instead.
3. **Mode-aware send, never breaks.** Auto-reset+`/continue` only fires when a live `claude` pane is registered for the project; otherwise it prints the manual next move. The companion script catches **all** exceptions and degrades to the manual branch.
4. **Atomic write before any reset.** The file is written before the pane is touched (matches the user's atomic-save discipline) — a dropped reset never loses the handover.
5. **Personal, not publishable as-is.** The script hardcodes the CCB lib path and assumes Windows/`py -3`. This skill is **personal infra**, coupled to the user's CCB install — unlike `recon`/`debrief` it is not meant for the public marketplace without parameterisation.

### Mechanism finding that shaped #3

A registry probe in the working session returned:

```
project_id: bfae8a9d...54e9c
claude record: NONE
claude pane_id: None
providers in registry: []
```

-> **the session was running *direct*, not inside a CCB pane.** A skill cannot type `/new` into its own REPL without a registered pane to drive. So the full auto-chain only works under CCB panes; direct mode is the primary path. (The user confirmed they run *mostly direct*.)

---

## 6. The handover-doc schema

`/handover` composes Markdown with these sections (scaled to the work; empty ones dropped):

- **Goal** — what we're achieving (tailored to the optional `[focus]` arg)
- **Status** — done / in-flight / blocked, stated as facts not commands
- **Key decisions (+ why)** — so the next session doesn't relitigate
- **Failed approaches / don't repeat** — dead ends already tried
- **Relevant files** — paths + line ranges; reference specs/plans/commits by path, don't duplicate
- **Next step** — the single concrete next action
- **Don't do** — anti-loop guard (rabbit holes to avoid)
- **Suggested skills** — what the next session should invoke

Rules: redact secrets; no raw conversation logs; dense over complete.

---

## 7. Build

| File | Purpose |
|---|---|
| [`SKILL.md`](./SKILL.md) | The skill: 3 steps (compose -> atomic-save -> mode-aware send) |
| [`handover_send.py`](./handover_send.py) | Companion: detect live `claude` pane -> reset + push `/continue`; else print `@path` + next move. Never raises. |

Install convention (this repo): develop here → `npm run validate` → `npm run link` (symlinks `skills/handover/` into `~/.claude/skills/handover/`). **Do not** hand-place real files in `~/.claude/skills/` — that creates the stale-copy problem already logged in `todo.md` for `recon`.

---

## 8. Verification

**Pilot (direct mode), 2026-06-04 — passed:**

- `py_compile` OK · skill registered in the session skill list.
- End-to-end: computed path → `mkdir -p .ccb/history` → `Write` doc → `handover_send.py` printed:
  ```
  Handover doc written.
  @C:/Users/aidan/git_projects/Assimilax/.ccb/history/claude-20260604-180640-handover.md
  Next: start a fresh session (/clear or a new window), then run /continue to load it.
  ```
- `/continue`'s `ls -t` resolves to the handover file (newest-wins) ✓.
- Exit 0 ✓.

**Not verified:** the CCB-paned auto-reset+`/continue` branch (no live `claude` pane existed). The defensive try/except means worst case is the manual branch above.

---

## 9. Caveats & open follow-ups

- **Paned auto-chain unverified.** Pilot it next time Claude runs under a CCB pane. If the `/new`→`/continue` timing drops the second command, bump `time.sleep(1.5)` in `handover_send.py`.
- **Self-pane reset semantics.** In paned mode, `/handover` resets the *current* claude pane — intended handoff behaviour, but means the "what happened" report lands in a session about to reset.
- **Windows/CCB coupling.** `CCB_LIB` path + `py -3` are hardcoded. Parameterise before any thought of publishing.
- **`.ccb/` must be gitignored** in any project where `/handover` or `/continue` runs (scratch, never commit).
- **Possible future:** a true cross-platform launch (`wt new-tab claude -p ...` on Windows, `claude -p` elsewhere) à la pchalasani, if the user ever wants a genuinely separate OS process instead of a pane reset.

---

## 10. Provenance

- Research workflow: `wf_10b9d666-ab6` (4 scouts + synthesis, ~520k subagent tokens).
- Built: 2026-06-04. Author: Aidan (Quigleybits) + Claude.
- Related skills in this repo: [`recon`](../recon/SKILL.md), [`debrief`](../debrief/SKILL.md).
