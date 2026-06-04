#!/usr/bin/env python3
"""handover_send.py — companion to the /handover skill.

After /handover writes the curated brief into ./.ccb/history/, this LAUNCHES a
fresh Claude Code session, pre-seeded to read that brief and continue the work —
so the user never has to type /clear + /continue by hand.

Launch: a NEW terminal window running ``claude "<seed>"``, where the seed tells
the new session to Read the brief and carry on. The current session is left
intact (non-destructive — it keeps the "launched" report).

  * Windows: ``subprocess`` with ``CREATE_NEW_CONSOLE``. No third-party terminal
    required — ``claude.exe`` gets its own console window. On Windows 11 that
    console opens via the default terminal handler (Windows Terminal); on older
    Windows it's a classic console. The seed is passed as one argv element (no
    shell), so quoting is a non-issue even for a long multi-sentence prompt.
  * Other OSes: auto-launch not yet wired -> manual fallback (@<path> + move).
  * Never raises: any failure degrades to the manual message, so /handover always
    finishes cleanly.

No WezTerm / tmux / CCB internals — works from a plain terminal.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

# Fallback location if `claude` is not on PATH (native installer dir on this machine).
KNOWN_CLAUDE = Path.home() / ".local" / "bin" / "claude.exe"

# Give the spawned claude its own console window (Windows). NOT DETACHED_PROCESS:
# a TUI needs a real console, and DETACHED_PROCESS would give it none.
CREATE_NEW_CONSOLE = getattr(subprocess, "CREATE_NEW_CONSOLE", 0x00000010)


def latest_handover() -> str | None:
    hist = Path.cwd() / ".ccb" / "history"
    files = sorted(hist.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0].as_posix() if files else None  # forward slashes — safe for Read on Windows


def resolve_claude() -> str | None:
    found = shutil.which("claude") or shutil.which("claude.exe")
    if found:
        return found
    return str(KNOWN_CLAUDE) if KNOWN_CLAUDE.exists() else None


def _seed(brief_path: str) -> str:
    """Opening prompt for the fresh session. Passed as one argv element (no shell),
    so embedded punctuation/quotes are preserved verbatim."""
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

    claude = resolve_claude()
    if not claude:
        manual(latest, reason="claude executable not found on PATH or at ~/.local/bin/claude.exe")
        return 0

    if os.name != "nt":
        # Auto-launch is wired for Windows only; elsewhere, hand back the manual move.
        manual(latest, reason=f"auto-launch not wired for os={os.name!r}")
        return 0

    cwd = str(Path.cwd())
    seed = _seed(latest)
    try:
        proc = subprocess.Popen([claude, seed], cwd=cwd, creationflags=CREATE_NEW_CONSOLE, close_fds=True)
        print(f"Handover launched: a fresh `claude` (pid {proc.pid}) is opening in a new terminal window, reading the brief and continuing.")
        print(f"@{latest}")
        return 0
    except Exception as exc:  # noqa: BLE001 — intentional catch-all: always degrade gracefully
        manual(latest, reason=str(exc))
        return 0


if __name__ == "__main__":
    sys.exit(main())
