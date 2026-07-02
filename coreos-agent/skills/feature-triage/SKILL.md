---
name: feature-triage
description: Triage RFEs in JIRA project RFE, component RHEL CoreOS - closed duplicates and team-review recommendation
---

# Feature Triage

Knowledge for triaging **RFEs** in the **RFE** JIRA project, **RHEL CoreOS** component.

## Querying RFEs for Triage

```jql
project = RFE AND component = "RHEL CoreOS" AND issuetype = RFE
  AND status not in (Closed, Done, Resolved, Cancelled)
```

## Finding Previously Closed RFEs

1. Build search terms from the request
2. Query closed RFEs in the same scope
3. Compare candidates (check resolution, fix version, linked epics)
4. Record links in JIRA

## Should a Team Member Review?

### No dedicated review needed

- Strong duplicate of a **Closed/Done** RFE
- Pure documentation/support request

### Team review recommended

- Partial overlap only
- Closed as **Won't Do / Declined**
- Conflicting closed RFEs
- Strategic, contractual, or security-sensitive
- No credible closed match after reasonable search

### Team review urgent

- Release train, customer commitment, or blocker language
- Duplicates an in-flight epic but reopens scope
