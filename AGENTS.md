# AI Agents Mono-Repo

Containerized AI agents for infrastructure management.

## Build System

Uses `just` (command runner) + `podman`. Key commands:

| Command | Purpose |
|---------|---------|
| `just all` | Build all images locally (native arch) |
| `just ci` | Build + push multi-arch images (amd64 + arm64) |
| `just base` | Build base image only |
| `just coreos-agent` | Build coreos-agent |
| `just fedora-agent` | Build fedora-agent |

**Rebuild base image when**: modifying [`base/Dockerfile.base`](base/Dockerfile.base) or [`scripts/entrypoint.sh`](scripts/entrypoint.sh)
**Rebuild agent image when**: modifying agent-specific files (`Dockerfile`, `opencode.json`, `AGENTS.md`, `skills/`, `agents/`, `commands/`)

## Agent Directory Structure

Each agent (`coreos-agent/`, `fedora-agent/`) is self-contained:

```
<agent>/
├── Dockerfile         # Extends base image
├── opencode.json      # OpenCode config (copied to /opt/opencode-config/)
├── AGENTS.md          # Agent-specific instructions
├── skills/            # Skill modules (SKILL.md with YAML frontmatter)
├── agents/            # Subagent definitions (.md with YAML frontmatter)
└── commands/          # Custom commands (.md)
```

## Runtime Behavior

[`scripts/entrypoint.sh`](scripts/entrypoint.sh) runs on container start and copies:
- `/opt/opencode-config/` → `~/.config/opencode/`
- `/opt/opencode-skills/` → `~/.config/opencode/skills/`
- `/opt/opencode-commands/` → `~/.config/opencode/commands/`
- `/opt/opencode-agents/` → `~/.config/opencode/agents/`

## Skill Format

Skills are directories with `SKILL.md`:

```yaml
---
name: skill-name
description: What this skill does
---
```

## Agent Definition Format

Agent definitions are `.md` files with YAML frontmatter:

```yaml
---
description: What this agent does
mode: subagent
model: provider/model-name
permission:
  edit: deny
  bash:
    "*": allow
---
```
