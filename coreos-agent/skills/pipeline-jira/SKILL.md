---
name: pipeline-jira
description: Create JIRA issues for CI pipeline failures - COS project conventions and subtask structure
---

# Pipeline JIRA

JIRA CLI commands and COS project conventions for tracking CI pipeline failures.

> Related: `pipeline-failures`

## JIRA CLI Commands

### Listing Issues

```bash
# List issues with JQL query
jira issue list --project COS --type Task -q "summary ~ 'Pipeline Monitoring'" --plain

# List open issues
jira issue list --project COS --status "Open" --plain

# List issues by component
jira issue list --project COS --component RHCOS --plain
```

### Creating Issues

```bash
# Create a sub-task
jira issue create --type Sub-task --parent <PARENT-KEY> --project COS \
  --summary "<job> #<build-number> - <stream> <brief-description>" \
  --label <label> \
  --body "<detailed-markdown-description>" --no-input

# Create a task
jira issue create --type Task --project COS \
  --summary "<summary>" \
  --body "<description>" --no-input
```

### Managing Issues

```bash
# Add a comment (comment text is a positional argument, NOT --body flag)
jira issue comment add <ISSUE-KEY> "<comment-text>"

# Multi-line comment
jira issue comment add <ISSUE-KEY> $'Line one\n\nLine two'

# View issue details
jira issue view <ISSUE-KEY>

# Transition issue status
jira issue move <ISSUE-KEY> "In Progress"
```

## COS Project Conventions

### Project: COS

The COS project is used for CoreOS-related issues.

### Pipeline Monitoring Tasks

Weekly Pipeline Monitoring tasks track CI failures.

**Naming convention:** `Pipeline monitoring - Sprint NNN - Ws YYYYMMDD`
- `Ws` = Week starting (Monday)
- One task per week

**Find current week's monitoring task:**

```bash
# Calculate Monday of current week
DOW=$(date +%u)
if [ "$DOW" -eq 1 ]; then
  MONDAY=$(date +%Y%m%d)
else
  MONDAY=$(date -d "last monday" +%Y%m%d)
fi

# Find this week's monitoring task
PARENT=$(jira issue list --project COS --type Task \
  -q "summary ~ 'Pipeline monitoring' AND summary ~ '$MONDAY'" \
  --plain --no-headers | head -1 | awk '{print $2}')
```

## Deduplication

Load **`pipeline-dedup`** skill for three-pass deduplication logic before creating subtasks.

## Sub-task Structure

Each build failure should be its own sub-task (including retries that failed).

**Summary format:**
```
<job> #<build-number> - <stream> [arch] <brief-description>
```

**Examples:**
- `build #3456 - rhel-9.6 kernel regression in selinux test`
- `build-arch #1234 - c9s s390x compose failure - repo timeout`
- `build-node-image #4216 - 4.20-9.6 TLS handshake timeout`

## Labels

| Label | When to Use |
|-------|-------------|
| `flake-infrastructure` | Transient infrastructure issues |
| `flake-test` | Flaky test failures |
| `bug` | Actual bugs requiring code fixes |
