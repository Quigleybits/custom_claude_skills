# Skill Comparison

Side-by-side comparison of all skills in the @quigleybits/claude-skills suite. Updated as new skills are added.

**Target:** 5 skills shipping together as a complete suite.

## The Suite

| # | Skill | Tagline |
|---|-------|---------|
| 1 | `/recon` | Read the terrain |
| 2 | `/debrief` | Close the mission |
| 3 | `/roe` | Rules of engagement |
| 4 | `/zero` | Align the sights |
| 5 | `/doctrine` | Encode lessons into law |

---

## /recon vs /debrief (Session Bookends)

| Dimension | `/recon` | `/debrief` |
|---|---|---|
| **When** | Session start | Session end |
| **Purpose** | Read the landscape — understand project state | Write back knowledge — preserve what was learned |
| **Direction** | Inbound: codebase → agent understanding | Outbound: session knowledge → persistent storage |
| **Phases** | 5 (Discover → Scan → Deep Read → Synthesize → Doc Health) | 6 (Assess → Triage → Commit Work → Discipline Audit → Route Knowledge → Commit & Report) |
| **Modifies files?** | Only if user opts in (doc health fixes) | Yes — auto-commits work + writes docs/memory |
| **Git interaction** | Reads `git log` + branch for context | Reads `git status`/`git diff`, creates 2 commits |
| **User interaction** | Gap analysis prompt, doc health picker (cherry-pick menu) | Triage prompt for substantive fixes `(y/N)` |
| **5 disciplines** | Used as **categorization lens** for reading docs | Used as **audit framework** for writing knowledge back |
| **Subagents** | Yes — parallel scouts for repos with >10 doc files | No — single-pass, keeps tool calls under 30 |
| **Token budget** | 25K tokens for deep reads | Under 30 tool calls total (context-conscious) |
| **Output** | Structured report: Current State, Next Steps (prioritized), Key Findings, Gap Analysis | Terse action list: Loose Ends, Knowledge Routed, Deferred Items, Commits |
| **Output sizing** | Always full report | Adaptive — 3-4 lines for light sessions, full report for heavy |
| **Commits** | 0 (read-only unless doc health opted in) | 2 (user work + debrief updates) |
| **Common mistakes** | 6 entries | 12 entries |
| **Word count** | 1142 words / ~1952 tokens | 1108 words / ~1808 tokens |
| **Eval tests** | 18 (8 true, 10 false) | 18 (8 true, 10 false) |
| **Unique to this skill** | Scout-based parallel scanning, codebase reality-checking, gap analysis with file creation | Enhancement lenses (cross-category, judgment line, time-bridging, compounding test), multi-target knowledge routing, triage auto-fix |

**The bookend symmetry:**
- Recon **reads** the 5 disciplines to tell you what exists and what's missing
- Debrief **writes** through the 5 disciplines to capture what changed and route it to the right place
