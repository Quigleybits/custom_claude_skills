#!/usr/bin/env python3
"""handover_send.py — companion to the /handover skill.

After /handover writes the curated brief into ./.ccb/history/, this LAUNCHES a
fresh Claude Code session, pre-seeded to read that brief and continue the work —
so the user never has to type /clear + /continue by hand.

Design:
  * Non-destructive. The current session is left intact (it keeps the
    "handover written + launched" report); a brand-new ``claude`` starts
    alongside it, already working from the brief. No self-reset, no lost report.
  * WezTerm-driven, public CLI only (no CCB internals -> no coupling):
      - inside WezTerm (WEZTERM_PANE set) -> new TAB in the current window
      - otherwise                         -> new WINDOW via ``cli spawn``,
                                             else ``wezterm start`` (cold GUI)
  * Seeded, not /continue. The new session is launched as
      ``claude.exe "<read-the-brief-and-continue instruction + abs path>"``
    which is more reliable than depending on @file auto-expansion.
  * Never raises. Any failure (no wezterm, no claude, spawn error) degrades to
    the manual message, so /handover always finishes cleanly.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

# Fallback locations if the binaries are not on PATH (this machine's installs).
KNOWN_CLAUDE = Path.home() / ".local" / "bin" / "claude.exe"
KNOWN_WEZTERM = Path(r"C:/Program Files/WezTerm/wezterm.exe")

# Windows: keep the spawned GUI alive after this helper exits.
_DETACHED = getattr(subprocess, "DETACHED_PROCESS", 0x00000008)


def latest_handover() -> str | None:
    hist = Path.cwd() / ".ccb" / "history"
    files = sorted(hist.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0].as_posix() if files else None  # forward slashes — safe for Read on Windows


def _resolve(name: str, known: Path) -> str | None:
    found = shutil.which(name) or shutil.which(f"{name}.exe")
    if found:
        return found
    return str(known) if known.exists() else None


def _seed(brief_path: str) -> str:
    """The opening prompt for the fresh session (passed as one argv element —
    no shell, so no quoting concerns)."""
    return (
        "You are continuing a handed-over Claude Code session. "
        f"First, use the Read tool to read the handover brief at {brief_path} — "
        "it is your full context: goal, key decisions, current state, relevant "
        "files, and the next step. Then carry on the work, starting from its "
        '"Next step" section. Do not wait for further instructions; begin now.'
    )


def manual(latest: str | None, reason: str = "") -> None:
    if reason:
        print(f"(auto-launch unavailable: {reason}; falling back to manual)", file=sys.stderr)
    print("Handover brief written.")
    if latest:
        print(f"@{latest}")
    print("Next: start a fresh session (/clear or a new window), then run /continue to load it.")


def main() -> int:
    latest = latest_handover()
    if not latest:
        print("No handover brief found in ./.ccb/history — nothing to launch.", file=sys.stderr)
        return 0

    wez = _resolve("wezterm", KNOWN_WEZTERM)
    claude = _resolve("claude", KNOWN_CLAUDE)
    if not wez or not claude:
        manual(latest, reason=f"wezterm={'ok' if wez else 'missing'}, claude={'ok' if claude else 'missing'}")
        return 0

    cwd = str(Path.cwd())
    seed = _seed(latest)
    in_wezterm = bool((os.environ.get("WEZTERM_PANE") or "").strip())

    try:
        # Primary: ask the running WezTerm GUI to spawn the session and tell us its pane id.
        spawn = [wez, "cli", "spawn", "--cwd", cwd]
        if not in_wezterm:
            spawn.append("--new-window")
        spawn += ["--", claude, seed]

        cp = subprocess.run(spawn, capture_output=True, text=True, timeout=15)
        if cp.returncode == 0:
            pane = (cp.stdout or "").strip()
            where = "new tab" if in_wezterm else "new window"
            print(f"Handover launched: fresh `claude` in a WezTerm {where} (pane {pane}), reading the brief and continuing.")
            print(f"@{latest}")
            return 0

        # Fallback: no running GUI to talk to -> cold-start one, detached so it survives this helper.
        subprocess.Popen([wez, "start", "--cwd", cwd, "--", claude, seed], creationflags=_DETACHED, close_fds=True)
        print("Handover launched: cold-started a WezTerm window running `claude`, reading the brief and continuing.")
        print(f"@{latest}")
        return 0
    except Exception as exc:  # noqa: BLE001 — intentional catch-all: always degrade gracefully
        manual(latest, reason=str(exc))
        return 0


if __name__ == "__main__":
    sys.exit(main())
