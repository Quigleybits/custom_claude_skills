# `/handover` — design, research & build notes

> Knowledge doc for the `/handover` skill. Captures the original ask, the ecosystem research,
> the design decisions, the build, how it was verified, and the open follow-ups.
> The operational skill itself lives next to this file: [`SKILL.md`](./SKILL.md) + [`handover_send.py`](./handover_send.py).
>
> **Status:** built + **pilot-verified end-to-end** (2026-06-04). `/handover` now auto-launches a
> fresh, seeded `claude` session (a new terminal window) that reads the brief and continues — no
> manual `/clear` + `/continue`. Verified by spawning a real session and confirming it read the
> brief and acted on its Next step.

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
| `/autonew <provider>` (skill → `autonew` bin) | Sends `/new` to a provider's registered pane via `backend.send_text(pane_id, "/new")` | Considered for the launch; **not used** — the shipped launcher spawns a new `claude` (see §5) |
| `/debrief` + `/recon` | Session-end / session-start bookends | Composes with `/handover` |
| `pane_registry.py` / `terminal.py` / `project_id.py` (CCB lib) | Pane registry + terminal backend (`send_text`, `is_alive`) keyed by a computed project id | An earlier design rode this; **not used** by the shipped launcher (`CREATE_NEW_CONSOLE`, no CCB internals) |

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

**Conclusion:** adapting a tmux/Zellij tool to Windows is more work and more brittle than building our own thin skill. → **Build.** (The first cut leaned on the CCB stack; the shipped launcher dropped it for a zero-install `CREATE_NEW_CONSOLE` spawn — see §5.)

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

### Principle: compose the curated brief, then launch a fresh session on it

```
/handover
   |  (1) Claude composes a curated handover BRIEF   <- the only "thinking" step
   |  (2) atomic-write -> ./.ccb/history/<utc>-handover.md   (newest-wins)
   v  (3) launch fresh session       ->  handover_send.py
        |- Windows:    Popen([claude.exe, "<seed>"], CREATE_NEW_CONSOLE)
        |              seed = "read <brief> and continue from Next step"
        |              -> claude boots in a new console window, auto-reads brief, carries on
        `- other/fail: print @<path> + "/clear then /continue"   (manual)
```

Non-destructive: the current session stays (keeps the launch report); the continuation runs in a
new window. `claude "<prompt>"` auto-runs the seed on boot, so the user types nothing.

### Key decisions

1. **Seed a fresh session, don't reuse `/continue`.** The launcher starts `claude "<seed>"` where the seed tells the new session to Read the brief and continue. More reliable than depending on `/continue`'s `@file` auto-expansion, and it removes any ordering/ingest coupling. (`/continue` remains the manual-fallback path.)
2. **Do not use `ctx-transfer`.** It's a raw transcript dump — the precise thing the ask says to avoid. Claude composes the curated brief instead.
3. **Launch new, never self-reset.** The continuation runs in a **new** window; the current session is untouched. Kills the old self-reset paradox (resetting the very pane that's reporting "what happened"), and a dropped launch never loses the brief.
4. **Atomic write before launch.** The brief is written (Write tool) before the launcher runs (matches the user's atomic-save discipline) — a failed launch still leaves a recoverable brief + the manual `@path` fallback.
5. **Zero-install, never breaks.** No third-party terminal — `CREATE_NEW_CONSOLE` gives `claude.exe` its own window (Windows Terminal on Win11, classic console on Win10). No WezTerm, no tmux, no CCB internals. Catches **all** exceptions to degrade to the manual message. Auto-launch is currently Windows-only (`py -3` + native `claude.exe`); the OS branch is the single extension point for mac/Linux.

### Mechanism findings that shaped the design

- **A skill can't reset its own REPL.** A running Claude session has no tool to `/clear` itself, so
  "automatic continuation" requires an *external* driver. Rather than depend on a CCB-registered pane
  (the user runs mostly *direct*, with no registered pane), the launcher starts a **new** session —
  which works from any terminal.
- **No terminal emulator needed.** `subprocess.Popen([claude, seed], creationflags=CREATE_NEW_CONSOLE)`
  gives `claude.exe` its own console window with zero third-party tools. On Windows 11 that console
  opens via the default terminal handler (Windows Terminal); on older Windows it's a classic console.
  (WezTerm was an early misstep — a niche install most users don't have.)
- **No quoting headaches.** The seed is passed as one argv element (no shell, no `wt`/`cmd` parsing),
  so even a long multi-sentence prompt with punctuation survives verbatim. `claude.exe` is a real
  executable (`~/.local/bin/claude.exe`); `claude "<prompt>"` auto-runs the seed on boot.

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
| [`SKILL.md`](./SKILL.md) | The skill: 3 steps (compose -> atomic-save -> launch fresh session) |
| [`handover_send.py`](./handover_send.py) | Companion: spawn a fresh seeded `claude` in a new console window (`CREATE_NEW_CONSOLE`, no third-party terminal) that reads the brief and continues; else print `@path` + manual next move. Never raises. |

Install convention (this repo): develop here → `npm run validate` → `npm run link` (symlinks `skills/handover/` into `~/.claude/skills/handover/`). **Do not** hand-place real files in `~/.claude/skills/` — that creates the stale-copy problem already logged in `todo.md` for `recon`.

---

## 8. Verification

**Pilot (auto-launch, full chain), 2026-06-04 — passed:**

- `py_compile` OK · `npm run validate` OK · skill registered in the session list.
- `CREATE_NEW_CONSOLE` mechanism verified in isolation first (harmless `cmd`): new console window,
  returncode 0 + child pid.
- **End-to-end (seed behaviour, observed via a WezTerm `get-text` harness):** synthetic brief whose
  Next step was "print `HANDOVER PILOT OK` and stop" → the spawned `claude` **read the brief and
  printed the line**, then idled. No `/clear`, no `/continue` typed. (This proved the seed auto-runs;
  the launcher then switched to `CREATE_NEW_CONSOLE` — same `claude.exe`, same seed.)
- **End-to-end (shipped `CREATE_NEW_CONSOLE` launcher):** ran `handover_send.py` → it spawned
  `claude.exe` (pid printed) in a new console window; `tasklist` confirmed the booted process
  (~450 MB). Killed + test `.ccb/` removed.
- Exit 0 ✓.

**Confirmed:** the seed auto-runs on boot; `Read` of the brief needed no permission prompt; no
third-party terminal required.

---

## 9. Caveats & open follow-ups

- **Windows-only auto-launch (no third-party terminal).** Uses `CREATE_NEW_CONSOLE`, so it works on
  any Windows machine with no install (WezTerm/tmux not required). On non-Windows it degrades to the
  manual `@path` message; wiring mac/Linux (e.g. `open -a Terminal`, `x-terminal-emulator`) is the one
  remaining extension point — the `os.name` branch in `handover_send.py`.
- **Spawned-session permissions.** The new session runs under the project's normal permission
  settings. `Read` of the brief auto-ran in the pilot; if a project restricts `Read`, the first action
  may prompt in the new window (user approves once).
- **`.ccb/` must be gitignored** in any project where `/handover` or `/continue` runs (scratch, never
  commit). Added to this repo's `.gitignore`.
- **Windows-shaped defaults.** The fallback `claude` path (`~/.local/bin/claude.exe`) and the `py -3`
  launcher in `SKILL.md` are Windows defaults. Generalise the `claude` lookup + launcher per-OS before
  any public release.

---

## 10. Provenance

- Research workflow: `wf_10b9d666-ab6` (4 scouts + synthesis, ~520k subagent tokens).
- Built: 2026-06-04. Author: Aidan (Quigleybits) + Claude.
- Related skills in this repo: [`recon`](../recon/SKILL.md), [`debrief`](../debrief/SKILL.md).
