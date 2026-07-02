---
name: initramfs-investigation
description: Investigate initramfs issues - extraction, module analysis, and comparing working vs failing builds
---

# Initramfs Investigation

Knowledge for investigating initramfs-related boot failures.

## Identify Compression Format

```bash
# Check magic bytes
head -c 6 initramfs.img | od -A x -t x1z
```

| Magic Bytes | Format | Tool |
|-------------|--------|------|
| `28 b5 2f fd` | zstd | `zstdcat` |
| `1f 8b` | gzip | `zcat` |
| `fd 37 7a 58` | xz | `xzcat` |

## Extract Initramfs

```bash
# For zstd-compressed (FCOS/RHCOS default)
mkdir extracted && cd extracted
zstdcat ../initramfs.img | cpio -idm

# List contents without extraction
lsinitrd initramfs.img
```

## Kernel Module Analysis

```bash
# Find kernel modules
find extracted -name "*.ko*"

# Check module architecture
readelf -h module.ko | grep -E "Data|Machine|Class"
```

## Comparing Working vs Failing Initramfs

1. Identify working and failing builds
2. Download both initramfs
3. Extract both
4. Compare kernel versions
5. Compare specific files
6. Check dracut configuration
