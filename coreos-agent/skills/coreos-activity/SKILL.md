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

### New Issues

```bash
gh search issues --owner coreos --created ">=$(date -d '7 days ago' +%Y-%m-%d)" \
  --limit 100 --json repository,title,author,number,url
```

### New PRs

```bash
gh search prs --owner coreos --created ">=$(date -d '7 days ago' +%Y-%m-%d)" \
  --limit 100 --json repository,title,author,number,url
```

### Merged PRs

```bash
gh search prs --owner coreos --merged ">=$(date -d '7 days ago' +%Y-%m-%d)" \
  --limit 100 --json repository,title,author,number,url
```

### Releases

```bash
for repo in coreos-assembler ignition bootupd afterburn zincati; do
  gh release list --repo coreos/$repo --limit 3
done
```

## Key Repositories

| Repository | Description |
|------------|-------------|
| `coreos-assembler` | cosa - the build tool for CoreOS images |
| `ignition` | First boot installer |
| `fedora-coreos-config` | Base configuration for FCOS |
| `openshift/os` | RHCOS issue tracker and extensions |
