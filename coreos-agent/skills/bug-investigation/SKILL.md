---
name: bug-investigation
description: Investigate OCPBUGS bug issues - tracing package sources, finding when changes were introduced
---

# OCPBUGS Investigation

Knowledge for investigating package-related issues in RHEL CoreOS.

## Querying RHCOS Package Versions

```bash
# List all RPMs in a release
oc adm release info quay.io/openshift-release-dev/ocp-release:4.21.3-x86_64 \
  --rpmdb --rpmdb-cache /tmp/rpmdb-cache

# Query a specific package
oc adm release info quay.io/openshift-release-dev/ocp-release:4.21.3-x86_64 \
  --rpmdb --rpmdb-cache /tmp/rpmdb-cache | grep <package-name>

# Compare RPMs between two releases
oc adm release info \
  quay.io/openshift-release-dev/ocp-release:4.21.2-x86_64 \
  quay.io/openshift-release-dev/ocp-release:4.21.3-x86_64 \
  --rpmdb-diff --rpmdb-cache /tmp/rpmdb-cache
```

## Dist-Git (pkgs.devel.redhat.com)

### Viewing Commit History

```bash
# View commit log for a branch
curl -sk "https://pkgs.devel.redhat.com/cgit/rpms/<package>/log/?h=<branch>"

# View a specific commit
curl -sk "https://pkgs.devel.redhat.com/cgit/rpms/<package>/commit/?h=<branch>&id=<commit-hash>"
```

### Branch Naming Convention

| Branch Pattern | Description |
|----------------|-------------|
| `rhaos-4.XX-rhel-Y` | OpenShift 4.XX for RHEL Y |
| `rhel-Y.Z.0` | RHEL Y.Z base |
| `c9s` | CentOS Stream 9 |

## Key Repositories

| Repository | Purpose |
|------------|---------|
| [coreos/rhel-coreos-config](https://github.com/coreos/rhel-coreos-config) | RHCOS base config |
| [coreos/fedora-coreos-config](https://github.com/coreos/fedora-coreos-config) | Upstream FCOS config |
| [openshift/os](https://github.com/openshift/os) | OCP node image layer |
