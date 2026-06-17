---
name: xquik-source-research
description: "Use when a task needs a cited public X source packet for market research, product research, content review, social evidence collection, or monitoring handoff. Routes agents through Xquik REST, MCP, or the x-developer TypeScript package and returns bounded, timestamped notes with source URLs or post IDs."
---

# Xquik Source Research

Produce a small, cited evidence packet from public X data. Do not turn it into a broad social-media study. The output should let another agent, analyst, or reviewer check exactly what was collected and when.

## Source Truth

- Docs overview: `https://docs.xquik.com/api-reference/overview`
- X API guide: `https://docs.xquik.com/alternatives/x-api`
- MCP endpoint: `https://xquik.com/mcp`
- TypeScript package: `x-developer`

## Required Inputs

Before fetching data, define:

- `question`: the claim or research question being checked
- `query`: search terms, usernames, tweet URLs, or tweet IDs
- `timeWindow`: date or recency boundary
- `sampleLimit`: maximum records to inspect
- `fields`: values needed by the downstream task

Ask one clarifying question only if the missing input changes the query or the safety boundary.

## Collection Path

1. Choose the integration path:
   - REST for scripts, apps, or repeatable jobs
   - MCP for agent workflows
   - `x-developer` for TypeScript projects
2. For REST tweet search, use `GET /api/v1/x/tweets/search` with the `x-api-key` header.
3. Preserve provenance for every item:
   - post ID or source URL
   - author handle
   - created timestamp
   - collection timestamp
   - query or route used
4. Keep the sample bounded. If the request needs more records, return the exact next query and handoff plan instead of expanding silently.

## Output Shape

```json
{
  "question": "What is being checked",
  "query": "from:example launch",
  "timeWindow": "2026-06-01 to 2026-06-17",
  "collectedAt": "2026-06-17T00:00:00Z",
  "sampleLimit": 25,
  "items": [
    {
      "postId": "123",
      "url": "https://x.com/example/status/123",
      "author": "example",
      "createdAt": "2026-06-10T12:00:00Z",
      "text": "Short cited excerpt or summary",
      "metrics": {
        "likes": 0,
        "reposts": 0,
        "replies": 0
      }
    }
  ],
  "caveat": "Bounded public X sample, not a full population study."
}
```

## Guardrails

- Never include API keys, OAuth tokens, cookies, or private account material in outputs.
- Do not claim the sample represents all X activity.
- Do not infer private demographics or identity traits.
- Keep write actions out of this workflow.
- Retry only on `429` and `5xx`, respect `Retry-After`, and stop after 3 attempts.
- If an export or long-running extraction is needed, estimate the scope first and hand off the exact query.
