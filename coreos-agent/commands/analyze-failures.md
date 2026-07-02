---
description: Analyze Jenkins build failures and generate a summary with root cause findings
argument-hint: "[job-name] [-n count] [--stream stream-name]"
---

# Analyze Jenkins Build Failures

Analyze recent failures from a Jenkins job, fetch console logs, compare with last known good builds, identify root causes.

## Arguments

- `job-name`: Jenkins job name to analyze (optional)
- `-n count`: Number of recent failures to analyze (default: 5)
- `--stream stream-name`: Filter by stream

## Execution Steps

### Step 1: List Recent Failures

```bash
coreos-tools jenkins builds list <job-name> --status FAILURE -n <count>
```

### Step 2: Get Build Details

```bash
coreos-tools jenkins builds info <job-name> <build-number>
```

### Step 3: Quick Failure Triage

```bash
# Check for kola test failures
coreos-tools jenkins builds kola-failures <job-name> <build-number>

# Check what packages changed
coreos-tools jenkins builds diff <job-name> <build-number>
```

### Step 4: Find Last Known Good Build

```bash
coreos-tools jenkins builds list <job-name> --status SUCCESS --stream <stream> -n 10
```

### Step 5: Compare Package Changes

```bash
coreos-tools jenkins builds diff <job-name> <good-build> <failed-build>
```

### Step 6: Fetch Logs

```bash
coreos-tools jenkins builds log <job-name> <build-number> | jq -r '.console_log[]' > /tmp/build.log
```
