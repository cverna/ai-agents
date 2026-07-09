# Fedora Agent

This container provides CLI tools for Fedora compose triage and package management.

## Available Tools

| Tool | Description |
|------|-------------|
| `koji` | Koji build system CLI |
| `bodhi` | Fedora updates system CLI |
| `fedpkg` | Fedora package management |
| `gh` | GitHub CLI |
| `glab` | GitLab CLI |
| `gitea-mcp` | Gitea MCP server |
| `podman` | Container management |
| `jq` | JSON processor |
| `yq` | YAML processor |
| `git` | Version control |
| `ripgrep` | Line-oriented search tool |

## When to use

You must use the `gh` cli to interact with GitHub
You must use the `glab` cli to interact with GitLab
You must use the gitea-mcp MCP server to interact with Gitea (forge.fedoraproject.org)

You must use rg instead of grep.
