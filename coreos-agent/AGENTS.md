# CoreOS Agent

This container provides CLI tools for managing CoreOS/RHCOS infrastructure.

## Available Tools

| Tool | Description |
|------|-------------|
| `coreos-tools` | Jenkins/Jira/OCP management |
| `jira` | Jira CLI |
| `gh` | GitHub CLI |
| `glab` | GitLab CLI |
| `koji` / `brew` | Koji/Brew build system CLI |
| `bodhi` | Fedora updates system CLI |
| `oc` | OpenShift CLI |
| `kubectl` | Kubernetes CLI |
| `podman` | Container management |
| `jq` | JSON processor |
| `yq` | YAML processor |
| `git` | Version control |
| `ripgrep` | Line-oriented search tool |

## When to use

You must use the `gh` cli to interact with GitHub
You must use the `jira` cli to interact with Jira
You must use the `glab` cli to interact with GitLab

You must use rg instead of grep.

## Modifying skills

Skill files are sourced from `/opt/opencode-skills/` and copied to `~/.config/opencode/skills/` on container start. Existing files in `~/.config/opencode/skills/` are **not** overwritten by default (`cp -n`), so edits made there persist across restarts.

- **Edit** skills in `~/.config/opencode/skills/` (on the volume, survives restarts)
- **Commit** changes to git when ready
- **Rebuild** the container image and sync new image skills with `SKILLS_FORCE_SYNC=1`
- To manually force a sync: delete the stale file from `~/.config/opencode/skills/` and restart,
  or run the container with `SKILLS_FORCE_SYNC=1`.
