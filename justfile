# ============================================================================
# AI Agents - Build and Run Recipes
# ============================================================================
#
# Usage:
#   just                  - Show available recipes
#   just all              - Build all images (local, native arch)
#   just ci               - Build all images (CI, multi-arch with push)
#   just run-fedora       - Run fedora-agent interactively
#
# Requirements:
#   - podman
#   - just (https://github.com/casey/just)
#
# ============================================================================

registry := "ghcr.io/cverna"
base_image := "ai-agents-base"
coreos_image := "coreos-agent"
fedora_image := "fedora-agent"
date_tag := `date +%Y%m%d`

# Default: show available recipes
default:
    @just --list

# ============================================================================
# LOCAL BUILDS (native arch only, no push)
# ============================================================================

# Build base image
base:
    podman build -t {{registry}}/{{base_image}}:latest -f base/Dockerfile.base .

# Build coreos-agent (requires base image)
coreos-agent:
    podman build -t {{registry}}/{{coreos_image}}:latest -f coreos-agent/Dockerfile coreos-agent/

# Build fedora-agent (requires base image)
fedora-agent:
    podman build -t {{registry}}/{{fedora_image}}:latest -f fedora-agent/Dockerfile fedora-agent/

# Build all images (local)
all: base coreos-agent fedora-agent

# ============================================================================
# CI MULTI-ARCH BUILDS (amd64 + arm64, with push)
# ============================================================================

# Build and push base image (multi-arch)
base-multiarch:
    @echo "Building {{base_image}} for linux/amd64 and linux/arm64..."
    podman manifest create {{registry}}/{{base_image}}:latest
    podman build --platform linux/amd64 --build-arg TARGETARCH=amd64 --manifest {{registry}}/{{base_image}}:latest -f base/Dockerfile.base .
    podman build --platform linux/arm64 --build-arg TARGETARCH=arm64 --manifest {{registry}}/{{base_image}}:latest -f base/Dockerfile.base .
    podman manifest push {{registry}}/{{base_image}}:latest docker://{{registry}}/{{base_image}}:latest
    podman manifest push {{registry}}/{{base_image}}:latest docker://{{registry}}/{{base_image}}:{{date_tag}}
    podman manifest rm {{registry}}/{{base_image}}:latest

# Build and push coreos-agent (multi-arch, requires base image in registry)
coreos-agent-multiarch:
    @echo "Building {{coreos_image}} for linux/amd64 and linux/arm64..."
    podman manifest create {{registry}}/{{coreos_image}}:latest
    podman build --platform linux/amd64 --build-arg TARGETARCH=amd64 --manifest {{registry}}/{{coreos_image}}:latest -f coreos-agent/Dockerfile coreos-agent/
    podman build --platform linux/arm64 --build-arg TARGETARCH=arm64 --manifest {{registry}}/{{coreos_image}}:latest -f coreos-agent/Dockerfile coreos-agent/
    podman manifest push {{registry}}/{{coreos_image}}:latest docker://{{registry}}/{{coreos_image}}:latest
    podman manifest push {{registry}}/{{coreos_image}}:latest docker://{{registry}}/{{coreos_image}}:{{date_tag}}
    podman manifest rm {{registry}}/{{coreos_image}}:latest

# Build and push fedora-agent (multi-arch, requires base image in registry)
fedora-agent-multiarch:
    @echo "Building {{fedora_image}} for linux/amd64 and linux/arm64..."
    podman manifest create {{registry}}/{{fedora_image}}:latest
    podman build --platform linux/amd64 --build-arg TARGETARCH=amd64 --manifest {{registry}}/{{fedora_image}}:latest -f fedora-agent/Dockerfile fedora-agent/
    podman build --platform linux/arm64 --build-arg TARGETARCH=arm64 --manifest {{registry}}/{{fedora_image}}:latest -f fedora-agent/Dockerfile fedora-agent/
    podman manifest push {{registry}}/{{fedora_image}}:latest docker://{{registry}}/{{fedora_image}}:latest
    podman manifest push {{registry}}/{{fedora_image}}:latest docker://{{registry}}/{{fedora_image}}:{{date_tag}}
    podman manifest rm {{registry}}/{{fedora_image}}:latest

# Build all images (CI, multi-arch with push)
ci: base-multiarch coreos-agent-multiarch fedora-agent-multiarch

# ============================================================================
# CLEANUP
# ============================================================================

# Remove local images
clean:
    @echo "Removing local images..."
    podman rmi {{registry}}/{{base_image}}:latest 2>/dev/null || true
    podman rmi {{registry}}/{{coreos_image}}:latest 2>/dev/null || true
    podman rmi {{registry}}/{{fedora_image}}:latest 2>/dev/null || true
    @echo "Done."

# Remove all dangling images and build cache
clean-all: clean
    podman image prune -f
    podman builder prune -f

# ============================================================================
# SECRETS SETUP (run once)
# ============================================================================

# Create podman secrets required by fedora-agent (run once before first use)
# Usage: GITEA_TOKEN_FILE=~/.config/gitea/token just setup-secrets
setup-secrets:
    podman secret create gitea-token ${GITEA_TOKEN_FILE:-~/.config/gitea/token}

# ============================================================================
# RUN CONTAINERS
# ============================================================================

# Run coreos-agent interactively
run-coreos:
    podman run -it --rm \
        -v coreos-agent-config:/home/agent/.config \
        -v {{justfile_directory()}}:/workspace \
        {{registry}}/{{coreos_image}}:latest

# Run fedora-agent interactively
run-fedora:
    podman run -it --rm \
        -v fedora-agent-config:/home/agent/.config \
        -v {{justfile_directory()}}:/workspace \
        --secret gitea-token \
        {{registry}}/{{fedora_image}}:latest

# Run coreos-agent with a shell
shell-coreos:
    podman run -it --rm \
        -v coreos-agent-config:/home/agent/.config \
        -v {{justfile_directory()}}:/workspace \
        --entrypoint /bin/bash \
        {{registry}}/{{coreos_image}}:latest

# Run fedora-agent with a shell
shell-fedora:
    podman run -it --rm \
        -v fedora-agent-config:/home/agent/.config \
        -v {{justfile_directory()}}:/workspace \
        --secret gitea-token \
        --entrypoint /bin/bash \
        {{registry}}/{{fedora_image}}:latest
