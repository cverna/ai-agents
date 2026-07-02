---
name: rhcos-ocp-release
description: OCP release queries - latest versions, RHCOS images, and RPM package lists
---

# RHCOS OCP Release

Query OCP release versions, RHCOS container images, and RPM package lists.

## Release Controller API

Base URL: `https://amd64.ocp.releases.ci.openshift.org`

### Querying Latest Versions

```bash
# Latest stable release
curl -s "https://amd64.ocp.releases.ci.openshift.org/api/v1/releasestream/4-stable/latest" | jq .

# Latest 4.21.x GA release
curl -s "https://amd64.ocp.releases.ci.openshift.org/api/v1/releasestreams/accepted" | \
  jq -r '."4-stable"[] | select(startswith("4.21.") and (contains("-rc") | not))' | head -1
```

## RHCOS Variants

Starting with OCP 4.21, each release ships **two RHCOS variants**:

| Variant | Image Name | RHEL Base |
|---------|------------|-----------|
| RHEL 9 | `rhel-coreos` | RHEL 9.x |
| RHEL 10 | `rhel-coreos-10` | RHEL 10.x |

## RPM Package Lists

```bash
# List all RPMs in a release
oc adm release info quay.io/openshift-release-dev/ocp-release:<version>-x86_64 \
  --rpmdb --rpmdb-cache /tmp/rpmdb-cache

# Query specific package
oc adm release info quay.io/openshift-release-dev/ocp-release:<version>-x86_64 \
  --rpmdb --rpmdb-cache /tmp/rpmdb-cache | grep kernel

# Compare RPMs between releases
oc adm release info \
  quay.io/openshift-release-dev/ocp-release:<v1>-x86_64 \
  quay.io/openshift-release-dev/ocp-release:<v2>-x86_64 \
  --rpmdb-diff --rpmdb-cache /tmp/rpmdb-cache
```
