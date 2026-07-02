## Automated CI Pipeline Check

Perform a pipeline health check using the agent workflow. Only report if issues are found.

### Step 1: Discovery

Use **@pipeline-monitor** to:
- Check `build`, `build-arch`, and `build-node-image` jobs
- Filter using 3-pass deduplication
- Auto-close open subtasks where a later successful build exists

### Step 2: Triage

For each pending TRIAGE, use **@pipeline-investigator** to:
- Gather build metadata and logs
- Classify the failure
- Produce triage summary with ROOT_CAUSE

### Step 3: Cluster by Root Cause

Group by similar ROOT_CAUSE across different streams/builds.

### Step 4: Create Jira

For each cluster, use **@pipeline-handoff** to create ONE subtask per cluster.
