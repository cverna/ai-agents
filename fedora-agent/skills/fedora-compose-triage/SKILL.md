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

**Related skills:** `fedora-ftbfs-search` (bug search)



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

| Title Pattern | Compose Type |
|---------------|--------------|
| `Fedora-Rawhide-*` | Rawhide nightly |
| `Fedora-eln-*` | ELN |
| `Fedora-{N}-updates*` | Updates |
| `Fedora-Container-*` | Container |
| `Fedora-Cloud-*` | Cloud |
| `Fedora-{N}-*` (branched) | Branched |

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

**KIWI tasks:** Parent `kiwiBuild` → child `createKiwiImage` (has logs). Use `koji taskinfo {task-id} --recurse` to find the child task.

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
| `nothing provides` | Missing dependency - extract package name |
| `package.*retired\|has been retired` | Package retired - consider image removal |
| `python\(abi\) = ([0-9.]+)` | Python ABI mismatch - rebuild for captured version |
| `python3\.([0-9]+)dist\(\)` | Python namespace mismatch |
| `perl(:MODULE_COMPAT_)` | Perl namespace mismatch |
| `nodejs(abi)` | Node.js ABI mismatch |
| `conflicting requests` | Dependency conflict |
| `matches only excluded` | Package filtered in treefile |
| `BuildrootError` | Mock environment failure |
| `LoraxError` | Boot ISO creation failure |
| `timeout` | Network/infrastructure issue |

**For each image:** Find all `nothing provides` lines, capture Python version from `python(abi) = X.YY`, report all affected packages.

**Detect Python version mismatch:** Compare buildroot Python version (`grep -E "python3-[0-9]+\.[0-9]+\.[0-9]+" log`) to `python(abi) = X.YY` in errors. If different, packages need rebuild for current Python.

**Output:**

```markdown
### Logs (excerpt)

#### {ImageName} (Task {task-id})
- **Error type:** {BuildrootError | DependencyResolution | Timeout | Other}
- **Python version:** buildroot has {X.Y}, packages need {A.B} ABI (if applicable)
- **All missing dependencies:** {list all "nothing provides" packages}
- **Key message:** {first meaningful error line}

(Repeat for each distinct failure pattern - group similar failures)
```

---

## Stage 4 — Analyze (root cause)

**Agent role:** Determine root cause for each failure type.

**Common root causes:**

| Category | Root Cause | Typical Error | Resolution |
|-----------|------------|---------------|------------|
| **dependency** | Python version upgrade | `python(abi) = X.YY` in errors, newer Python in buildroot | Rebuild packages for current Python version |
| **dependency** | Namespace mismatch | `perl(:MODULE_COMPAT_)`, `nodejs(abi)` | Rebuild package |
| **dependency** | Missing package | `nothing provides PACKAGE` | Tag or replace package |
| **dependency** | Version conflict | `requires >= X but Y available` | Update package |
| **dependency** | Package retired | `package has been retired` | Remove from image or retire image |
| **infrastructure** | Buildroot failure | `BuildrootError`, mock errors | Check buildvm, retry |
| **infrastructure** | Network issue | `timeout`, `connection refused` | Retry, check infra |
| **configuration** | Excluded package | `matches only excluded` | Update treefile/profile |
| **tooling** | Lorax/KIWI bug | Unexpected errors | File bug |
| **unknown** | Unclear | Insufficient info | Deeper investigation |

**Analysis workflow:**

1. Check if failures share common package/namespace
2. For Python errors: compare `python(abi) = X.YY` to buildroot Python version → if different, root cause is "Python version upgrade"
3. Look for infrastructure issues affecting multiple tasks
4. Check if compose repo had issues (timing, stale data)

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

**Output:**

```markdown
### Classify
- **Primary:** {dependency | infrastructure | configuration | tooling | unknown}
- **Confidence:** {high | medium | low}
- **Why:** {1-3 sentences explaining the classification}
```

---

## Stage 6 — Summarize (triage conclusion)

**Agent role:** Produce concise handoff for humans.

**Output format:** Output directly as markdown (no code fences).

### Affected Images

- **ImageName** - Missing `package-name` needed by dependent-package
- **ImageName** - Python version mismatch: buildroot has Python 3.15, packages need 3.14 ABI. Rebuild needed for: pkg1, pkg2. Missing deps: `python3.14dist(module1)`, `python3.14dist(module2)`
- **ImageName** - Multiple packages retired (pkg1, pkg2, pkg3) - consider image removal

**Guidelines:**
- One line per failed image - no exceptions
- List all missing dependencies explicitly (don't summarize or truncate)
- Do NOT group images with "Other..." or "Similar..." summaries
- Every image gets its own line with its specific packages, even if root cause is shared
- For Python ABI issues: State both versions (buildroot X.Y, packages need A.B ABI)
- Distinguish between packages needing rebuild vs missing dependency modules
- Note if packages are retired (suggest image removal)
- Link to existing bugs if known
- Do not repeat information already in the issue (compose ID, logs, phase timing)
- Bug IDs in the Related Bugs table must be hyperlinked to Bugzilla: `[ID](https://bugzilla.redhat.com/show_bug.cgi?id=ID)`

**Bug search:**
1. Extract all packages from the analysis
2. Use `fedora-ftbfs-search` skill with packages and Fedora release number
3. Append the "Related Bugs" section to the output

**Example output (follow this format exactly):**

```markdown
### Affected Images

- **COSMIC-Atomic** - Missing `pop-sound-theme` needed by cosmic-settings-daemon
- **Games** - Python version mismatch: buildroot has Python 3.15, packages need 3.14 ABI. Rebuild needed for: pychess-1.0.5-3.fc44. Missing deps: `python3.14dist(psutil)`, `python3.14dist(websockets)`, `python3.14dist(pygobject)`, `python3.14dist(pexpect)`, `python3.14dist(pycairo)`, `python3.14dist(sqlalchemy)`
- **Robotics** - Python version mismatch: buildroot has Python 3.15, packages need 3.14 ABI. Rebuild needed for: python3-vcstool-0.3.0-16.fc44. Missing deps: `python3.14dist(setuptools)`, `python3.14dist(pyyaml)`
- **SoaS** - Multiple sugar packages retired (sugar, sugar-toolkit-gtk3, sugar-browse, sugar-cp-all, sugar-log, sugar-read) - consider image removal

### Related Bugs

| Bug ID | Summary | Status |
|---------|---------|--------|
| [2434943](https://bugzilla.redhat.com/show_bug.cgi?id=2434943) | pychess: FTBFS in Fedora rawhide/f44 | NEW |
| [2485737](https://bugzilla.redhat.com/show_bug.cgi?id=2485737) | F45FailsToInstall: pychess | NEW |
| [2485978](https://bugzilla.redhat.com/show_bug.cgi?id=2485978) | F45FailsToInstall: python3-vcstool | NEW |
| [2477818](https://bugzilla.redhat.com/show_bug.cgi?id=2477818) | F45FailsToInstall: python3-spyder | NEW |
| [2477817](https://bugzilla.redhat.com/show_bug.cgi?id=2477817) | F45FailsToInstall: python3-spyder-kernels | NEW |
| [2460120](https://bugzilla.redhat.com/show_bug.cgi?id=2460120) | python-astroquery fails to build with Python 3.15 | ASSIGNED |
| [2485707](https://bugzilla.redhat.com/show_bug.cgi?id=2485707) | F45FailsToInstall: python3-ginga+qt5, ... | ASSIGNED |
```


## Execution Rules

1. Complete **Stages 1–6 in order** when user provides `ISSUE_NUMBER`.
2. Ask for `ISSUE_NUMBER` only if missing; do not ask "what next?" between stages.
3. On curl/network errors, report the error and continue with available data.
4. **Do not post comments** to the issue - output only.
5. Use `fedora-compose-failures` skill for deeper dependency analysis if needed.
6. Use `fedora-ftbfs-search` skill to find existing FTBFS/FTI bugs for packages from analysis.
