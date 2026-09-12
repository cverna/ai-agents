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

The agents read the GitHub token from a file at `/run/secrets/github-token`
(mounted read-only). The fedora-agent additionally mounts
`/run/secrets/gitea-token`.

```bash
# CoreOS Agent
docker run -it --rm \
  -v coreos-agent-config:/home/agent/.config \
  -v ~/.config/github/token:/run/secrets/github-token:ro \
  -v $(pwd):/workspace \
  ghcr.io/cverna/coreos-agent:latest

# Fedora Agent
docker run -it --rm \
  -v fedora-agent-config:/home/agent/.config \
  -v ~/.config/github/token:/run/secrets/github-token:ro \
  -v ~/.config/gitea/token:/run/secrets/gitea-token:ro \
  -e GITEA_ACCESS_TOKEN_FILE=/run/secrets/gitea-token \
  -v $(pwd):/workspace \
  ghcr.io/cverna/fedora-agent:latest
```

With podman, create the secrets once (`just setup-secrets`) and pass them with
`--secret github-token` / `--secret gitea-token` (see the `justfile`).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITEA_ACCESS_TOKEN_FILE` | Path to the Gitea token file (fedora-agent) |
| `JIRA_API_TOKEN` | Jira Personal Access Token (coreos-agent) |
| `JIRA_AUTH_TYPE` | Set to "bearer" for Jira token auth |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID (for Vertex AI) |

## License

MIT
