---
description: Run ordered pipeline triage for one failed Jenkins build
argument-hint: "<job-name> <build-number>"
---

# Pipeline Triage

Run a structured triage workflow for a single failed Jenkins build.

## Arguments

- `$1` — Jenkins job name (e.g., `build`, `build-arch`, `release`)
- `$2` — Build number (integer)

## Workflow

Load and follow the **`pipeline-triage-workflow`** skill end-to-end:

1. **Stage 1 - Gather**: Collect build metadata
2. **Stage 2 - Logs**: Pull console log and extract key errors
3. **Stage 3 - Classify**: Categorize the failure type
4. **Stage 4 - Summarize**: Produce handoff package

## Commands

```bash
# Stage 1: Gather metadata
coreos-tools jenkins builds info $1 $2
coreos-tools jenkins jobs info $1

# Stage 2: Get logs
coreos-tools jenkins builds log $1 $2 | jq -r '.console_log[]' > /tmp/build.log

# Check kola failures
coreos-tools jenkins builds kola-failures $1 $2
```

## Output format

```markdown
### Gather
- **Job:** …
- **Build:** …
- **Status / result:** …

### Logs (excerpt)
- **Key errors:** …

### Classify
- **Primary:** infrastructure | flake | test_regression | package_change | registry_auth | tooling | unknown

### Triage summary
- **ROOT_CAUSE:** …
- **Summary:** …
- **Suggested next steps:** …
```
