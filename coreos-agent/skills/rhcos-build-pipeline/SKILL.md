---
name: rhcos-build-pipeline
description: RHCOS build pipeline - scheduling, two-stage builds, versionlock mechanism, and troubleshooting
---

# RHCOS Build Pipeline

Knowledge about the RHEL CoreOS build pipeline, Jenkins jobs, and multi-architecture builds.

## Build Process Overview

RHCOS is built in two stages:

**Stage 1: Base Image** (`build` + `build-arch` jobs)
- Input: `rhel-coreos-config` repository
- The `build` job runs for x86_64 and triggers `build-arch` for other architectures
- Output: Bootable container with RHEL content only

**Stage 2: Node Image** (`build-node-image` job)
- Input: Base image from Stage 1 + `openshift/os` Containerfile
- Adds OpenShift packages: kubelet, cri-o, oc, etc.
- Output: `rhel-coreos` image in OCP release payload

## Jenkins Jobs

| Job | Architecture | Purpose |
|-----|--------------|---------|
| `build` | x86_64 | Main RHCOS base image build, triggers build-arch |
| `build-arch` | aarch64, ppc64le, s390x | Architecture-specific base builds |
| `build-node-image` | all | Node image build (adds OCP packages) |
| `release` | all | Release builds |

## Build Scheduling

### build-mechanical Job

- **Schedule:** Daily at **10:00 UTC**
- **Execution Order:** c10s → c9s → rhel-10.2 → rhel-9.8 → rhel-9.6

## FORCE Parameter

| FORCE Value | Behavior |
|-------------|----------|
| `false` (default) | Skip build if no config changes detected |
| `true` | Always rebuild, even without config changes |

## Job Commands

```bash
# List all jobs
coreos-tools jenkins jobs list

# Get job info
coreos-tools jenkins jobs info <job-name>

# Trigger a build
coreos-tools jenkins jobs build <job-name> --param STREAM=<stream>

# Trigger a forced build
coreos-tools jenkins jobs build <job-name> --param STREAM=<stream> --param FORCE=true
```
