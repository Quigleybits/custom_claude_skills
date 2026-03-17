# Claude Code Feature Requests

Feature requests collected during skill development. These are capabilities that would make skills more powerful or easier to build.

---

## 1. Expose context usage to hooks via environment variable

**Request:** Pass `$CLAUDE_CONTEXT_PERCENT` (or similar) to all hook scripts.

**Why:** Currently there's no way for hooks to know how full the context window is. The status bar displays this to the user, but the data isn't accessible programmatically. Hooks that need context-aware behavior (like triggering a skill before compaction) must either parse the full transcript JSONL or rely on the `PreCompact` hook as an indirect signal.

**Current workaround:** Use `PreCompact` hook to detect when compaction is imminent (~95% by default). Or estimate tokens from `transcript_path` file size (~4 chars/token).

**Ideal API:**
```json
{
  "session_id": "abc123",
  "transcript_path": "...",
  "context_percent": 78,
  "context_tokens_used": 156000,
  "context_tokens_max": 200000,
  "hook_event_name": "Stop"
}
```

**Impact:** Enables context-aware automation — skills that activate at thresholds, hooks that warn before context gets critical, smarter compaction strategies.

---

## 2. Allow PreCompact hook to run skills before compaction

**Request:** When a `PreCompact` hook blocks compaction (exit 2), allow the block reason to reference a skill (e.g., "run /conlib first") and have Claude Code automatically invoke it.

**Why:** Currently exit code 2 blocks compaction and shows the reason to Claude, who then needs to interpret it and invoke the skill. This works but adds a layer of indirection. Direct skill invocation from hooks would be cleaner.

**Current workaround:** PreCompact hook exits 2 with a reason message. Claude reads the message and runs the skill manually. Works but relies on Claude interpreting the instruction correctly every time.

---

## 3. Expose model name/context window size to hooks

**Request:** Pass `$CLAUDE_MODEL` and `$CLAUDE_CONTEXT_MAX` to hook scripts.

**Why:** Context thresholds depend on model (200K default, 1M extended). Hooks that estimate context usage need to know the ceiling. Currently you'd have to hardcode or configure this per-project.

**Current workaround:** Hardcode threshold or use `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` to normalize the trigger point regardless of absolute size.
