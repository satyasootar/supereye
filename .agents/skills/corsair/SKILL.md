---
name: corsair
description: Integrate apps and agents with Gmail, Slack, GitHub, Outlook, and hundreds of other services via Corsair. Use when setting up Corsair for agents or deterministically running operations (like workflow automations or buttons like "Send to Slack").
---

# Corsair

**Canonical setup (Corsair App):** fetch and follow [Agent setup](https://docs.corsair.dev/app/agent-setup.md) end-to-end. Do not guess APIs — use that page and the links it provides.

- **Doc index:** [docs.corsair.dev/llms.txt](https://docs.corsair.dev/llms.txt)
- **Integrations catalog (paths + schemas):** [api.corsair.dev/md/integrations](https://api.corsair.dev/md/integrations)
- **Human intro:** [Introduction](https://docs.corsair.dev/app/home.md)
- **Integrations catalog:** [api.corsair.dev/md/integrations](https://api.corsair.dev/md/integrations)
- **Dashboard:** [app.corsair.dev](https://app.corsair.dev)

**Default to Corsair App (hosted)** unless the user explicitly wants self-hosted → [SDK introduction](https://docs.corsair.dev/getting-started/introduction.md).

# Corsair integration

When writing code that uses Corsair:

1. Run `npm run corsair:list` (or `npx corsair list`) to discover available operations.

   Examples:
   - `npm run corsair:list -- --plugin=slack`
   - `npx corsair list --type=db`

2. Run `npm run corsair:schema -- <path>` (or `npx corsair schema <path>`) before calling any operation.

   Example:
   - `npx corsair schema slack.api.messages.post`

Never infer endpoint names or argument shapes from source files.

Always use the CLI commands as the source of truth.