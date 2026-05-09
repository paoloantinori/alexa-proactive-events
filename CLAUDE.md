
# Alexa Ping Me — Proactive Events Skill

Sends proactive notifications (yellow ring light) to Alexa devices using the `AMAZON.MessageAlert.Activated` schema.

## Architecture

**Skill ID**: `amzn1.ask.skill.6acf77b8-6d1a-4049-9975-2a294cefe16c` (development stage)

- `server/alexa_skill_server.py` — Python HTTPS skill endpoint (zero deps). Must be running and publicly accessible.
- `server/server.js` — Node.js equivalent of the Python server (used during development, not currently active).
- `scripts/send-notification.js` — Node.js script that calls the Proactive Events API via LWA OAuth2.
- `manifest-put.json` — Active skill manifest template (SMAPI format, no secrets).
- `skill-package/models/` — Interaction models (en-US, it-IT).
- `lambda/custom/` — Lambda handler (unused; we use the HTTPS endpoint instead).

## Environment

Required env vars (or pass via CLI flags):

```bash
export LWA_CLIENT_ID="amzn1.application-oa2-client..."
export LWA_CLIENT_SECRET="amzn1.oa2-cs.v1..."
export ALEXA_USER_ID="amzn1.ask.account..."  # for unicast (ping-me.sh)
```

## Commands

```bash
# Start the skill server (must be publicly reachable via HTTPS)
python3 server/alexa_skill_server.py [port]

# Send multicast notification (all subscribed devices)
./scripts/ping-me-multicast.sh [sender_name] [count]

# Send unicast notification (single device, needs ALEXA_USER_ID)
./scripts/ping-me.sh [sender_name] [count]

# Update skill manifest after endpoint change
ask smapi update-skill-manifest -s $SKILL_ID -g development --manifest "$(cat manifest-put.json)"

# Upload interaction model
ask smapi set-interaction-model -s $SKILL_ID -g development -l it-IT --interaction-model "$(cat skill-package/models/it-IT.json)"

# Re-enable skill after manifest changes
ask smapi set-skill-enablement -s $SKILL_ID -g development
```

## Gotchas

- **Use SMAPI, not `ask deploy`**: This skill uses an HTTPS endpoint (not Lambda). Deploy via `ask smapi` commands directly.
- **Stable endpoint required**: The skill endpoint must be reliably reachable. Free tunneling services (localhost.run) die every ~5 minutes — use your own infrastructure.
- **Notification schema has no message body**: `AMAZON.MessageAlert.Activated` only shows "you have N messages from [sender]". The `creator.name` field is the only customizable text.
- **Locale must match**: If the user's device is `it-IT`, the manifest must declare `it-IT` locale AND have an uploaded `it-IT` interaction model, or the skill won't work on that device.
- **Region matters**: Use `--region eu` for European devices. The API endpoint, skill enablement, and user ID are all region-specific.
- **After manifest changes**: Disable and re-enable the skill in the Alexa app, then toggle notification permissions back on.

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->
