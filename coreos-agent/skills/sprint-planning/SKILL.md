---
name: sprint-planning
description: Sprint Review and Planning for COS project - velocity analysis, carryover management, and sprint composition
---

# Sprint Review and Planning

Guide for conducting Sprint Review and Sprint Planning for COS project.

## COS Project Conventions

### Sprint Naming
- East team: `CoreOS East - Sprint NNN`
- West team: `CoreOS West - Sprint NNN`

### Sprint Duration
- Typically 3 weeks

## JIRA CLI Commands

### Sprint Discovery

```bash
# List active sprints
jira sprint list --project COS --state active

# List future sprints
jira sprint list --project COS --state future
```

### Sprint Issues

```bash
# List all issues in a sprint
jira issue list --jql 'project = COS AND sprint = "CoreOS East - Sprint NNN"' --plain

# List closed issues
jira issue list --jql 'project = COS AND sprint = "CoreOS East - Sprint NNN" AND status = Closed' --plain
```

## Velocity Benchmarks

| Velocity | Assessment |
|----------|------------|
| > 5 pts/day | Excellent |
| 3-5 pts/day | Good |
| 2-3 pts/day | Below target |
| < 2 pts/day | Needs attention |

| Completion Rate | Assessment |
|-----------------|------------|
| > 80% | Excellent |
| 70-80% | Good (target) |
| 50-70% | Below target |
| < 50% | Needs attention |
