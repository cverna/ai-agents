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

## Modifying skills

Skill files are sourced from `/opt/opencode-skills/` and copied to `~/.config/opencode/skills/` on container start. Existing files in `~/.config/opencode/skills/` are **not** overwritten by default (`cp -n`), so edits made there persist across restarts.

- **Edit** skills in `~/.config/opencode/skills/` (on the volume, survives restarts)
- **Commit** changes to git when ready
- **Rebuild** the container image and sync new image skills with `just rebuild`
  (`just all` + runs container with `SKILLS_FORCE_SYNC=1` to overwrite volume from new image)
- To manually force a sync: delete the stale file from `~/.config/opencode/skills/` and restart,
  or run the container with `SKILLS_FORCE_SYNC=1`.
