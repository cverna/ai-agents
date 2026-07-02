---
name: fedora-compose-triage
description: Triage Fedora compose-tracker issues - staged workflow for investigating FINISHED_INCOMPLETE and DOOMED composes
license: CC BY-SA 4.0
metadata:
  author: cverna
---

# Fedora Compose Tracker Issue Triage

Run **one compose-tracker issue** through a **fixed sequence** of stages. Each stage produces structured output for the next.

**Input (required):** `ISSUE_NUMBER` (integer from compose-tracker-issues)

**Related skills:** `fedora-compose-failures` (deep analysis), `fedora-compose` (process knowledge), `fedora-versions` (release info)

---

## Issue Tracker

| Resource | URL |
|----------|-----|
| Issues API | `forge.fedoraproject.org/api/v1/repos/releng/compose-tracker-issues/issues` |
| Issue Web | `forge.fedoraproject.org/releng/compose-tracker-issues/issues/{ISSUE_NUMBER}` |

---

## Stage 1 — Gather (issue metadata)

**Agent role:** Fetch issue and extract compose identification.

**Run:**
```bash
curl -s "https://forge.fedoraproject.org/api/v1/repos/releng/compose-tracker-issues/issues/{ISSUE_NUMBER}" | \
  jq '{number, title, state, created_at, body}'
```

**Parse compose ID from title:**
- Pattern: `Fedora-{VARIANT}-{DATE}.{TYPE}.{RESPIN} {STATUS}`
- Examples:
  - `Fedora-Rawhide-20260701.n.0 FINISHED_INCOMPLETE`
  - `Fedora-eln-20260701.n.0 DOOMED`
  - `Fedora-43-updates-testing-20260630.0 FINISHED_INCOMPLETE`

**Determine compose type:**

| Title Pattern | Compose Type | Log Base URL |
|---------------|--------------|--------------|
| `Fedora-Rawhide-*` | Rawhide nightly | `kojipkgs.fedoraproject.org/compose/rawhide/` |
| `Fedora-eln-*` | ELN | `kojipkgs.fedoraproject.org/compose/eln/` |
| `Fedora-{N}-updates*` | Updates | `kojipkgs.fedoraproject.org/compose/updates/` |
| `Fedora-Container-*` | Container | `kojipkgs.fedoraproject.org/compose/container/` |
| `Fedora-Cloud-*` | Cloud | `kojipkgs.fedoraproject.org/compose/cloud/` |
| `Fedora-{N}-*` (branched) | Branched | `kojipkgs.fedoraproject.org/compose/branched/` |

**Output:**

```markdown
### Gather
- **Issue:** #{number}
- **Compose ID:** {extracted from title}
- **Status:** FINISHED_INCOMPLETE | DOOMED
- **Compose Type:** Rawhide | ELN | Branched | Updates | Cloud | Container
- **Date:** {YYYY-MM-DD}
- **URL:** https://forge.fedoraproject.org/releng/compose-tracker-issues/issues/{number}
```

---

## Stage 2 — Parse (failed tasks)

**Agent role:** Extract all failed tasks from issue body.

**Parse patterns from body:**

| Failure Type | Pattern | Extract |
|--------------|---------|---------|
| OSTree container | `[FAIL] Ostree container (variant VAR, arch ARCH)` | variant, arch, task ID |
| OSTree | `[FAIL] Ostree (variant VAR, arch ARCH)` | variant, arch, task ID |
| KIWI | `[FAIL] Kiwibuild (variant VAR, arch *, subvariant SUB)` | variant, subvariant, task ID |
| Buildinstall | `Compose run failed: Runroot task failed: TASKID` | task ID |
| ImageBuilder | `[FAIL] ImageBuilder` | variant, task ID |

**Extract from body:**
```bash
curl -s "https://forge.fedoraproject.org/api/v1/repos/releng/compose-tracker-issues/issues/{ISSUE_NUMBER}" | \
  jq -r '.body'
```

**Look for:**
1. Task IDs (numbers like `147256897`)
2. Log file paths (e.g., `logs/x86_64/COSMIC-Atomic/ostree-container-1/runroot.log`)
3. Error snippets in `<pre>` blocks

**Output:**

```markdown
### Parse
Failed tasks: {N} total

| Task ID | Type | Variant | Arch | Log Path |
|---------|------|---------|------|----------|
| 147256897 | ostree-container | COSMIC-Atomic | x86_64 | logs/x86_64/COSMIC-Atomic/ostree-container-1/runroot.log |
| 147258257 | kiwibuild | Labs-Scientific | * | logs/global/kiwibuild/Labs-Scientific-...log |
| ... | ... | ... | ... | ... |
```

---

## Stage 3 — Logs (fetch and analyze)

**Agent role:** Fetch logs for each failed task to find error patterns.

**Log URL construction:**

For compose logs:
```
https://kojipkgs.fedoraproject.org/compose/{type}/{compose-id}/logs/{log-path}
```

For Koji task logs:
```
https://kojipkgs.fedoraproject.org//work/tasks/{last4}/{task-id}/
```

Where `{last4}` is the last 4 digits of task ID (zero-padded).

**Important: KIWI task hierarchy**
```
kiwiBuild (parent task) → createKiwiImage (child task with logs)
```
KIWI parent tasks only have `checkout.log`. Use `koji taskinfo {task-id} --recurse` to find child `createKiwiImage` task with actual logs (`image-root.*.log`, `mock_output.log`, etc.).

**Log files by failure type:**

| Failure Type | Primary Log | What to Look For |
|--------------|-------------|------------------|
| OSTree container | `runroot.log` | BuildrootError, dependency errors |
| OSTree | `runroot.log` | rpm-ostree errors, package issues |
| KIWI | `image-root.{arch}.log` | "Problem:", "nothing provides", namespace mismatches |
| Buildinstall | `build.log` | lorax errors, missing packages |
| General | `mock_output.log` | DNF resolution errors |
| General | `dnf5.log` | Dependency resolution details |

**Fetch commands:**

```bash
# Compose log
curl -s "https://kojipkgs.fedoraproject.org/compose/{type}/{compose-id}/{log-path}" | tail -100

# Koji task directory (list available logs)
curl -s "https://kojipkgs.fedoraproject.org//work/tasks/{last4}/{task-id}/"

# Find child tasks (KIWI builds have createKiwiImage children with logs)
koji taskinfo {task-id} --recurse

# Specific Koji log
curl -s "https://kojipkgs.fedoraproject.org//work/tasks/{last4}/{task-id}/mock_output.log" | tail -200
curl -s "https://kojipkgs.fedoraproject.org//work/tasks/{last4}/{task-id}/build.log" | tail -200
```

**Error patterns to search:**

| Pattern | Meaning |
|---------|---------|
| `nothing provides` | Missing dependency |
| `python3.XXdist()` | Python namespace mismatch |
| `perl(:MODULE_COMPAT_)` | Perl namespace mismatch |
| `nodejs(abi)` | Node.js ABI mismatch |
| `conflicting requests` | Dependency conflict |
| `matches only excluded` | Package filtered in treefile |
| `BuildrootError` | Mock environment failure |
| `LoraxError` | Boot ISO creation failure |
| `timeout` | Network/infrastructure issue |

**Output:**

```markdown
### Logs (excerpt)

#### Task {task-id} ({variant} {arch})
- **Error type:** {BuildrootError | DependencyResolution | Timeout | Other}
- **Key message:** {first meaningful error line}
- **Log URL:** https://kojipkgs.fedoraproject.org/...

(Repeat for each distinct failure pattern - group similar failures)
```

---

## Stage 4 — Analyze (root cause)

**Agent role:** Determine root cause for each failure type.

**Common root causes:**

| Category | Root Cause | Typical Error | Resolution |
|----------|------------|---------------|------------|
| **dependency** | Namespace mismatch | `python3.XXdist()`, `perl(:MODULE_COMPAT_)` | Rebuild package |
| **dependency** | Missing package | `nothing provides PACKAGE` | Tag or replace package |
| **dependency** | Version conflict | `requires >= X but Y available` | Update package |
| **infrastructure** | Buildroot failure | `BuildrootError`, mock errors | Check buildvm, retry |
| **infrastructure** | Network issue | `timeout`, `connection refused` | Retry, check infra |
| **configuration** | Excluded package | `matches only excluded` | Update treefile/profile |
| **tooling** | Lorax/KIWI bug | Unexpected errors | File bug |
| **unknown** | Unclear | Insufficient info | Deeper investigation |

**Analysis workflow:**

1. Check if failures share common package/namespace
2. Look for infrastructure issues affecting multiple tasks
3. Check if compose repo had issues (timing, stale data)

**Output:**

```markdown
### Analyze

| Task Pattern | Root Cause | Confidence | Details |
|--------------|------------|------------|---------|
| COSMIC-Atomic OSTree | infrastructure | medium | BuildrootError in mock setup |
| Labs/Spins KIWI | dependency | high | Common package missing from buildroot |
| ... | ... | ... | ... |
```

---

## Stage 5 — Classify (overall issue)

**Agent role:** Assign primary category for the entire issue.

**Categories (pick one primary):**

| Category | When to Use |
|----------|-------------|
| `dependency` | Package resolution failures (missing, namespace, version) |
| `infrastructure` | Buildvm, network, storage, or compose host issues |
| `configuration` | Treefile, comps, or variant config issues |
| `tooling` | Pungi, KIWI, Lorax, rpm-ostree bugs |
| `unknown` | Cannot determine from available logs |

**Confidence levels:**
- **high:** Clear error message, obvious root cause
- **medium:** Likely cause identified, needs verification
- **low:** Speculative, insufficient evidence

**Output:**

```markdown
### Classify
- **Primary:** {dependency | infrastructure | configuration | tooling | unknown}
- **Confidence:** {high | medium | low}
- **Why:** {1-3 sentences explaining the classification}
```

---

## Stage 6 — Summarize (triage conclusion)

**Agent role:** Produce handoff package for humans.

**Output:**

```markdown
### Triage Summary

**Summary:** {One paragraph describing the failure, root cause, and impact}

**Affected images:**
- {Variant} ({arch}) - {failure type}
- ...

**Root cause:** {dependency issue | infrastructure failure | configuration problem | unknown}

**Suggested actions:**
1. {Specific action with owner if known}
2. {Additional investigation if needed}
3. {Related issues to check}

**Key logs:**
- [Global log]({url})
- [{Variant} {arch} log]({url})

**Compose info:**
- Compose ID: {id}
- Started: {date}
- Duration: {if available}
- Phase failures: {list from pungi.global.log}
```

---

## Execution Rules

1. Complete **Stages 1–6 in order** when user provides `ISSUE_NUMBER`.
2. Ask for `ISSUE_NUMBER` only if missing; do not ask "what next?" between stages.
3. On curl/network errors, report the error and continue with available data.
4. **Do not post comments** to the issue - output only.
5. Use `fedora-compose-failures` skill for deeper dependency analysis if needed.

---

## Quick Reference Commands

```bash
# Fetch issue
curl -s "https://forge.fedoraproject.org/api/v1/repos/releng/compose-tracker-issues/issues/{ISSUE_NUMBER}" | jq '.'

# Fetch global log
curl -s "https://kojipkgs.fedoraproject.org/compose/{type}/{compose-id}/logs/global/pungi.global.log" | tail -100

# List Koji task logs
curl -s "https://kojipkgs.fedoraproject.org//work/tasks/{last4}/{task-id}/"

# Find child tasks (critical for KIWI builds)
koji taskinfo {task-id} --recurse

# Fetch mock output log
curl -s "https://kojipkgs.fedoraproject.org//work/tasks/{last4}/{task-id}/mock_output.log" | tail -200

# Fetch KIWI image-root log (use child task ID from koji taskinfo --recurse)
curl -s "https://kojipkgs.fedoraproject.org//work/tasks/{last4}/{child-task-id}/image-root.x86_64.log" | tail -200

# Search for dependency errors in log
grep -E "nothing provides|Problem:|conflicting requests|python3\.[0-9]+dist" {log-file}
```
