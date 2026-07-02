---
name: pipeline-triage-workflow
description: Ordered agent-style triage for a single failed Jenkins build - gather metadata, logs, classification, summary
---

# Pipeline Triage Workflow (agentic)

Run **one failed build** through a **fixed sequence** of stages.

**Inputs (required):** `JOB` (Jenkins job name), `BUILD` (integer build number).

## Jenkins Job Hierarchy

| Job | Has downstream? | Analysis approach |
|-----|-----------------|-------------------|
| `build` | **Yes** → triggers `build-arch` per-arch | Check which arch failed, analyze that `build-arch` job |
| `build-arch` | **No** (leaf job) | Analyze directly - kola tests run here |
| `build-node-image` | **No** (independent pipeline) | Analyze directly - does NOT trigger `build-arch` |

## Stage 1 — Gather (build metadata)

```bash
coreos-tools jenkins builds info <JOB> <BUILD>
coreos-tools jenkins jobs info <JOB>
```

**Output:**
```markdown
### Gather
- **Job:** …
- **Build:** …
- **Status / result:** …
- **Stream / parameters:** …
- **URL:** …
```

## Stage 2 — Logs (console evidence)

```bash
coreos-tools jenkins builds log <JOB> <BUILD> | jq -r '.console_log[]' > /tmp/build.log
```

**Output:**
```markdown
### Logs (excerpt)
- **Key errors:** …
- **Patterns seen:** …
```

## Stage 3 — Classify

**Categories (pick one primary):** `infrastructure` | `flake` | `test_regression` | `package_change` | `registry_auth` | `tooling` | `unknown`

**Output:**
```markdown
### Classify
- **Primary:** …
- **Confidence:** low | medium | high
- **Why:** …
```

## Stage 4 — Summarize (triage conclusion)

**Output:**
```markdown
### Triage summary
- **ROOT_CAUSE:** <short description for clustering>
- **Classification:** <category>
- **Summary:** One paragraph describing the failure, root cause, and impact.
- **Evidence:** build URL, log pointers
- **Suggested next steps:** rerun / open COS subtask / escalate
```

## Execution rules

1. Complete **Stages 1–4 in order**
2. Ask for **JOB** and **BUILD** only if missing
3. On CLI errors, stop and report; do not invent build data
