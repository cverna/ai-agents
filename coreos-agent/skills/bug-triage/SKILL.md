---
name: bug-triage
description: Triage bugs and failures - categorization, severity assessment, and root cause analysis patterns
---

# Bug Triage

Knowledge for triaging bugs, failures, and issues in the CoreOS ecosystem.

## RHCOS Triage Labels

### Primary Triage Labels

| Label | Purpose | When to Apply |
|-------|---------|---------------|
| `rhcos-triaged` | Bug has been reviewed | After initial review |
| `rhcos-engaged` | RHCOS team is actively investigating | When actively debugging |
| `rhcos-waitingonrhel` | Blocked waiting on RHEL team | When root cause is in RHEL package |
| `rhcos-bootimage-needed` | Fix requires new bootimage | When fix landed but needs bootimage bump |

### Triage Workflow

1. **New Bug** (no labels) - Bug is filed
2. **rhcos-triaged** - Initial review complete
3. **Closed/Verified** - Fix delivered and confirmed

## Severity Classification

| Priority | Criteria | Response Time |
|----------|----------|---------------|
| **Critical** | Pipeline blocked, cluster install broken | Immediate |
| **Major** | Core functionality affected | Same day |
| **Normal** | Standard bugs | Within sprint |
| **Minor** | Low impact | Backlog |

## Triage Checklist

1. Review the bug description
2. Check for duplicates
3. Identify affected component
4. Determine blocking status
5. Apply appropriate labels
6. Set priority
