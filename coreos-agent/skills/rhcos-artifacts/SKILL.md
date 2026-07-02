---
name: rhcos-artifacts
description: RHCOS build artifacts, package comparison, and coreos-assembler version tracking
---

# RHCOS Artifacts

Build artifacts, package comparison commands, and coreos-assembler version tracking.

## Artifact Commands

```bash
# List build artifacts
coreos-tools jenkins builds artifacts <job-name> <build-number>

# Download a specific artifact
coreos-tools jenkins builds artifacts <job-name> <build-number> --download <artifact-name>

# Download to specific path
coreos-tools jenkins builds artifacts <job-name> <build-number> --download <artifact-name> -o /tmp/output.json
```

## Package Comparison

### Single Build Diff

```bash
coreos-tools jenkins builds diff <job-name> <build-number>
```

### Two Build Comparison

```bash
coreos-tools jenkins builds diff <job-name> <build1> <build2>
```

### Analyzing Diffs

```bash
# List all changed package names
coreos-tools jenkins builds diff <job-name> <b1> <b2> | jq -r '.changed[].name'

# Show kernel changes specifically
coreos-tools jenkins builds diff <job-name> <b1> <b2> | jq '.changed[] | select(.name == "kernel")'

# Count changes
coreos-tools jenkins builds diff <job-name> <b1> <b2> | jq '{added: (.added | length), removed: (.removed | length), changed: (.changed | length)}'
```

## Comparing coreos-assembler Versions

```bash
# Download cosa git info from both builds
coreos-tools jenkins builds artifacts <job-name> <failed-build> --download coreos-assembler-git.json -o /tmp/failed-cosa.json
coreos-tools jenkins builds artifacts <job-name> <good-build> --download coreos-assembler-git.json -o /tmp/good-cosa.json

# Compare
diff /tmp/good-cosa.json /tmp/failed-cosa.json

# Find commits between versions
gh api repos/coreos/coreos-assembler/compare/<old-commit>...<new-commit> \
  --jq '.commits[] | {sha: .sha[0:7], date: .commit.author.date, message: .commit.message | split("\n")[0]}'
```
