---
name: rhcos-brew
description: Brew (Red Hat build system) - package searches, NVR naming, tags, and package sources
---

# Brew (Red Hat Build System)

Brew is Red Hat's internal Koji instance for tracking package builds.

**Web UI:** https://brewweb.engineering.redhat.com/brew/

## Package Search

```bash
# Search by package name
brew search package <package-name>

# Examples
brew search package cri-o
brew search package conmon-rs
```

## Build Search

```bash
# Get latest build for a tag
brew latest-build <tag> <package>

# Examples
brew latest-build rhaos-4.18-rhel-9-candidate cri-o
brew latest-build rhaos-4.19-rhel-10-candidate conmon-rs

# List all builds of a package
brew list-builds --package=<package>
```

## Getting Build Information

```bash
# Get detailed build info
brew buildinfo <nvr>
brew buildinfo cri-o-1.30.0-1.rhaos4.18.el9

# List tags a build is in
brew list-tags --build=<nvr>

# List RPMs in a build
brew buildinfo <nvr> | grep -A100 "^RPMs:"
```

## NVR Naming Convention

### OpenShift-Specific Packages (Plashet/RHAOS)

```
conmon-rs-0.6.6-0.rhaos4.18.el10.1
└──────┘ └───┘ └─────────────────┘
  name   ver        release
               └────┘ └──┘
              ocp4.18 rhel10
```

### RHEL Packages

```
kernel-5.14.0-570.94.1.el9_6.x86_64
└────┘ └───────────────┘ └───┘
 name       version       rhel9.6
```

## Common Tag Patterns

| Tag Pattern | Meaning |
|-------------|---------|
| `rhaos-4.XX-rhel-Y` | OCP 4.XX plashet for RHEL Y |
| `rhel-Y.Z-baseos` | RHEL Y.Z base OS |
| `rhel-Y-server-ose-4.XX` | RHEL Y for OCP 4.XX |
