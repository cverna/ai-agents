---
name: coreos-activity
description: CoreOS GitHub/GitLab activity summaries - issues, PRs, releases for CoreOS org, openshift/os, and fedora/bootc
---

# CoreOS Activity Summary

Generate comprehensive activity summaries for the CoreOS ecosystem.

## Time Range Options

| Range | Command |
|-------|---------|
| Last 7 days | `date -d '7 days ago' +%Y-%m-%d` |
| Last 30 days | `date -d '30 days ago' +%Y-%m-%d` |

## Core Commands (GitHub)

Use the `github` MCP server tools for all GitHub queries. Compute the date with
`date -d '7 days ago' +%Y-%m-%d` and substitute it for `<since>` below.

### New Issues

Call `search_issues`:

```
query: org:coreos created:>=<since>
perPage: 100
```

### New PRs

Call `search_pull_requests`:

```
query: org:coreos created:>=<since>
perPage: 100
```

### Merged PRs

Call `search_pull_requests`:

```
query: org:coreos merged:>=<since>
perPage: 100
```

### Releases

Call `list_releases` once per repository (owner `coreos`, `perPage` 3):

```
coreos-assembler, ignition, bootupd, afterburn, zincati
```

## Key Repositories

| Repository | Description |
|------------|-------------|
| `coreos-assembler` | cosa - the build tool for CoreOS images |
| `ignition` | First boot installer |
| `fedora-coreos-config` | Base configuration for FCOS |
| `openshift/os` | RHCOS issue tracker and extensions |
