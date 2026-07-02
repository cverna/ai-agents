# AI Agents Mono-Repo

A mono-repo containing AI agents for infrastructure management, each with its own container image, skills, and commands.

## Agents

| Agent | Description | Image |
|-------|-------------|-------|
| [coreos-agent](./coreos-agent) | CoreOS/RHCOS infrastructure management | `ghcr.io/cverna/coreos-agent:latest` |
| [fedora-agent](./fedora-agent) | Fedora compose/triage and package management | `ghcr.io/cverna/fedora-agent:latest` |

## Structure

```
ai-agents/
├── scripts/
│   └── entrypoint.sh          # Shared entrypoint for all agents
├── base/
│   └── Dockerfile.base        # Base image with common tools
├── coreos-agent/
│   ├── Dockerfile             # Builds from base image
│   ├── opencode.json          # OpenCode configuration
│   ├── AGENTS.md              # Agent instructions
│   ├── agents/                # Agent definitions
│   ├── skills/                # Skill modules
│   ├── commands/              # Command definitions
│   └── config/                # Configuration files
└── fedora-agent/
    ├── Dockerfile             # Builds from base image
    ├── opencode.json          # OpenCode configuration
    ├── AGENTS.md              # Agent instructions
    ├── agents/                # Agent definitions
    ├── skills/                # Skill modules
    └── commands/              # Command definitions
```

## Building

### Build Base Image

```bash
docker build -t ghcr.io/cverna/ai-agents-base:latest -f base/Dockerfile.base .
```

### Build Agent Images

```bash
# CoreOS Agent
docker build -t ghcr.io/cverna/coreos-agent:latest -f coreos-agent/Dockerfile coreos-agent/

# Fedora Agent
docker build -t ghcr.io/cverna/fedora-agent:latest -f fedora-agent/Dockerfile fedora-agent/
```

## Running

```bash
# CoreOS Agent
docker run -it --rm \
  -v coreos-agent-config:/home/agent/.config \
  -e GH_TOKEN="your-github-token" \
  -v $(pwd):/workspace \
  ghcr.io/cverna/coreos-agent:latest

# Fedora Agent
docker run -it --rm \
  -v fedora-agent-config:/home/agent/.config \
  -e GH_TOKEN="your-github-token" \
  -v $(pwd):/workspace \
  ghcr.io/cverna/fedora-agent:latest
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GH_TOKEN` | GitHub Personal Access Token |
| `JIRA_API_TOKEN` | Jira Personal Access Token (coreos-agent) |
| `JIRA_AUTH_TYPE` | Set to "bearer" for Jira token auth |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID (for Vertex AI) |

## License

MIT
