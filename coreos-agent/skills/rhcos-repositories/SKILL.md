---
name: rhcos-repositories
description: RHCOS GitHub repositories, package definitions, and test locations
---

# RHCOS Repositories

GitHub repositories, package definitions, and test locations for RHEL CoreOS.

## GitHub Repositories

| Repository | Purpose |
|------------|---------|
| [coreos/fedora-coreos-config](https://github.com/coreos/fedora-coreos-config) | Upstream FCOS manifests |
| [coreos/rhel-coreos-config](https://github.com/coreos/rhel-coreos-config) | RHCOS/SCOS config |
| [coreos/coreos-assembler](https://github.com/coreos/coreos-assembler) | Build tool (cosa) and kola test framework |
| [coreos/fedora-coreos-pipeline](https://github.com/coreos/fedora-coreos-pipeline) | Jenkins pipeline definitions |
| [openshift/os](https://github.com/openshift/os) | Node image layer (adds OCP packages) |

## Package Definitions

### Base OS Packages (Stage 1)

Defined in `rhel-coreos-config`:
- `packages-rhcos.yaml` - RHCOS-specific packages
- `manifest-*.yaml` - Stream-specific manifests

### OpenShift Packages (Stage 2)

Defined in `openshift/os`:
- `packages-openshift.yaml` - OCP node packages

## Test Locations

| Repository | Test Path |
|------------|-----------|
| `fedora-coreos-config` | `tests/kola/` |
| `rhel-coreos-config` | `tests/kola/` |
| `openshift/os` | `tests/kola/` |
| `coreos-assembler` | `mantle/kola/tests/` |
