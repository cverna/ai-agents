---
name: jira-estimation
description: Estimate Jira story points - scope analysis, comparable stories, and estimation guidelines
---

# Jira Story Point Estimation

Guide for estimating story points on Jira issues with consistent methodology.

## JIRA CLI Commands

### Viewing Issue Details

```bash
# View issue with comments
jira issue view <ISSUE-KEY> --comments 10

# Get story points (customfield_10028)
jira issue view <ISSUE-KEY> --raw | jq '.fields.customfield_10028'
```

### Finding Comparable Stories

```bash
# Find closed stories with story points matching keywords
jira issue list --jql 'project = COS AND type = Story AND status = Closed AND "Story Points[Number]" > 0 AND summary ~ "<keyword>"' --plain
```

## Story Point Scale

| Points | Complexity | Duration |
|--------|------------|----------|
| 1 | Trivial | < 1 day |
| 2 | Simple | 1-2 days |
| 3 | Moderate | 2-3 days |
| 5 | Complex | 3-5 days |
| 8+ | Too Large | Must be split |

## Estimation Factors

| Factor | Increases Points | Decreases Points |
|--------|------------------|------------------|
| **Dependencies** | External blockers | Self-contained |
| **Clarity** | Vague requirements | Clear requirements |
| **Scope** | Multiple repos | Single file |
| **Testing** | New infrastructure needed | Existing patterns |
