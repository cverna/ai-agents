---
name: fcos-overrides
description: Fedora CoreOS package overrides - fast-tracking, pinning, and graduation status
---

# FCOS Package Overrides

Knowledge for inspecting Fedora CoreOS package overrides.

## Overview

FCOS uses `manifest-lock.overrides.yaml` to:
- **Fast-track**: Pull in Bodhi updates before they reach stable
- **Pin**: Hold back packages at specific versions

## Viewing Current Overrides

```bash
# Fetch current overrides from testing-devel
gh api -H "Accept: application/vnd.github.raw" \
  /repos/coreos/fedora-coreos-config/contents/manifest-lock.overrides.yaml?ref=testing-devel
```

## Override Format

### Fast-track

```yaml
packages:
  ignition:
    evr: 2.26.0-1.fc43
    metadata:
      type: fast-track
      bodhi: https://bodhi.fedoraproject.org/updates/FEDORA-XXXX-XXXXXXXXXX
```

### Pin

```yaml
packages:
  dracut:
    evr: 053-5.fc43
    metadata:
      type: pin
      reason: https://github.com/coreos/fedora-coreos-tracker/issues/XXX
```

## Checking Bodhi Update Status

```bash
# Query by update ID
bodhi updates query --updateid <FEDORA-XXXX-XXXXXXXXXX>

# Check if package has stable updates
bodhi updates query --packages <package> --releases f43 --status stable
```

## Checking Koji Tags

```bash
# Check if package is in stable Fedora repos
koji list-tagged --latest f43-updates <package>

# Check updates-testing
koji list-tagged --latest f43-updates-testing <package>
```
