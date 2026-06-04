#!/usr/bin/env python3
"""handover_send.py — companion to the /handover skill.

After /handover has written the curated doc into ./.ccb/history/, this either:
  * CCB-paned mode: resets the registered `claude` pane to a fresh session and
    pushes `/continue` so the new session auto-loads the handover; or
  * Direct mode (no live claude pane): prints `@<path>` + the manual next move.

It NEVER raises — any failure (no pane, CCB internals changed, etc.) degrades to
the direct-mode message, so /handover always finishes cleanly.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

# CCB (codex-dual) library — same internals autonew relies on.
CCB_LIB = r"C:/Users/aidan/AppData/Local/codex-dual/lib"


def latest_handover() -> str | None:
    hist = Path.cwd() / ".ccb" / "history"
    files = sorted(hist.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0].as_posix() if files else None  # forward slashes — safest for @file on Windows


def manual(latest: str | None) -> None:
    print("Handover doc written.")
    if latest:
        print(f"@{latest}")
    print("Next: start a fresh session (/clear or a new window), then run /continue to load it.")


def main() -> int:
    latest = latest_handover()
    try:
        sys.path.insert(0, CCB_LIB)
        from pane_registry import load_registry_by_project_id, _get_providers_map
        from project_id import compute_ccb_project_id
        from terminal import get_backend_for_session

        pid = compute_ccb_project_id(Path.cwd())
        rec = load_registry_by_project_id(pid, "claude")
        pm = _get_providers_map(rec) if rec else {}
        pane = str((pm.get("claude") or {}).get("pane_id") or "").strip()

        if not rec or not pane:
            manual(latest)
            return 0

        backend = get_backend_for_session(rec)
        if not backend or not backend.is_alive(pane):
            manual(latest)
            return 0

        # CCB-paned mode: reset the claude pane, then load the handover.
        backend.send_text(pane, "/new")
        time.sleep(1.5)
        backend.send_text(pane, "/continue")
        print("Handover written + auto-sent: reset the claude pane and pushed /continue.")
        return 0
    except Exception as exc:  # noqa: BLE001 — intentional catch-all: always degrade gracefully
        print(f"(auto-chain unavailable: {exc}; falling back to manual)", file=sys.stderr)
        manual(latest)
        return 0


if __name__ == "__main__":
    sys.exit(main())
