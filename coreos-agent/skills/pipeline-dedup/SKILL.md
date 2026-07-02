---
name: pipeline-dedup
description: Deduplication logic for CI pipeline failures - check Jira for existing tracking with semantic analysis
---

# Pipeline Deduplication

Check if a failure is already tracked in Jira before investigating or creating issues.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `JOB` | Yes | Jenkins job name |
| `BUILD` | Yes | Build number |
| `STREAM` | Yes | Jenkins stream parameter |
| `ARCH` | For build-arch | Architecture |

## Deduplication Workflow

### Pass 1: Exact Build Match

```bash
jira issue list --parent $PARENT \
  -q "summary ~ '$JOB #$BUILD'" --plain --no-headers
```

**If found → Return `EXACT_MATCH: <JIRA-KEY>`**

### Pass 2: Similar Failure Check

```bash
jira issue list --parent $PARENT -s~Closed \
  -q "summary ~ '$JOB' AND summary ~ '$STREAM'" \
  --plain --no-headers
```

**If found → Return `RELATED_ISSUE: <JIRA-KEY>`**

### Pass 3: Semantic Analysis

Fetch all open subtasks and analyze semantically for same root cause.

**If LLM identifies a match → Return `SEMANTIC_MATCH: <JIRA-KEY>`**

## Output Format

| Result | Action |
|--------|--------|
| `EXACT_MATCH: COS-XXXX` | Skip - no action needed |
| `RELATED_ISSUE: COS-XXXX` | Comment on existing issue |
| `SEMANTIC_MATCH: COS-XXXX` | Comment on existing issue |
| `NEW_FAILURE` | Proceed with triage/creation |
