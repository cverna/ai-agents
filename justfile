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
tag := env_var_or_default("IMAGE_TAG", "latest")
date_tag := env_var_or_default("IMAGE_DATE_TAG", `date +%Y%m%d`)

# Default: show available recipes
default:
    @just --list

# ============================================================================
# LOCAL BUILDS (native arch only, no push)
# ============================================================================

# Build base image
base:
    podman build -t {{registry}}/{{base_image}}:{{tag}} -f base/Dockerfile.base .

# Build coreos-agent (requires base image)
coreos-agent:
    podman build --build-arg BASE_TAG={{tag}} -t {{registry}}/{{coreos_image}}:{{tag}} -f coreos-agent/Dockerfile coreos-agent/

# Build fedora-agent (requires base image)
fedora-agent:
    podman build --build-arg BASE_TAG={{tag}} -t {{registry}}/{{fedora_image}}:{{tag}} -f fedora-agent/Dockerfile fedora-agent/

# Build all images (local)
all: base coreos-agent fedora-agent

# ============================================================================
# CI MULTI-ARCH BUILDS (native per-arch build + manifest assembly, with push)
# ============================================================================
#
# The CI workflow builds each architecture on a native GitHub runner
# (ubuntu-latest for amd64, ubuntu-24.04-arm for arm64) and then assembles the
# per-arch tags into a single multi-arch manifest. No QEMU emulation involved.

# Build and push one architecture of an image (CI matrix step)
# usage: just build-arch <image> <dockerfile> <context> <arch>
build-arch image dockerfile context arch:
    @echo "Building {{image}} ({{tag}}) for linux/{{arch}}..."
    podman build --platform linux/{{arch}} --build-arg TARGETARCH={{arch}} \
        --build-arg BASE_TAG={{tag}} \
        -t {{registry}}/{{image}}:{{tag}}-{{arch}} -f {{dockerfile}} {{context}}
    podman push {{registry}}/{{image}}:{{tag}}-{{arch}}

# Assemble the per-arch tags into a multi-arch manifest, pushed as {{tag}} and {{date_tag}}
# usage: just publish-manifest <image>
publish-manifest image:
    @echo "Publishing {{image}} manifest ({{tag}}, {{date_tag}})..."
    podman manifest create {{registry}}/{{image}}:{{tag}}
    podman manifest add {{registry}}/{{image}}:{{tag}} docker://{{registry}}/{{image}}:{{tag}}-amd64
    podman manifest add {{registry}}/{{image}}:{{tag}} docker://{{registry}}/{{image}}:{{tag}}-arm64
    podman manifest push {{registry}}/{{image}}:{{tag}} docker://{{registry}}/{{image}}:{{tag}}
    podman manifest push {{registry}}/{{image}}:{{tag}} docker://{{registry}}/{{image}}:{{date_tag}}
    podman manifest rm {{registry}}/{{image}}:{{tag}}

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

# Create podman secrets required by the agents (run once before first use)
# Usage: GITEA_TOKEN_FILE=~/.config/gitea/token GITHUB_TOKEN_FILE=~/.config/github/token just setup-secrets
setup-secrets:
    podman secret create gitea-token ${GITEA_TOKEN_FILE:-~/.config/gitea/token}
    podman secret create github-token ${GITHUB_TOKEN_FILE:-~/.config/github/token}

# ============================================================================
# RUN CONTAINERS
# ============================================================================

# Run coreos-agent interactively (set SKILLS_FORCE_SYNC=1 to reseed from image after rebuild)
run-coreos:
    podman run -it --rm \
        -v coreos-agent-config:/home/agent/.config \
        -v {{justfile_directory()}}:/workspace \
        --secret github-token \
        -e SKILLS_FORCE_SYNC=${SKILLS_FORCE_SYNC:-0} \
        {{registry}}/{{coreos_image}}:latest

# Run fedora-agent interactively (set SKILLS_FORCE_SYNC=1 to reseed from image after rebuild)
run-fedora:
    podman run -it --rm \
        -v fedora-agent-config:/home/agent/.config \
        -v {{justfile_directory()}}:/workspace \
        --secret gitea-token \
        --secret github-token \
        -e GITEA_ACCESS_TOKEN_FILE=/run/secrets/gitea-token \
        -e SKILLS_FORCE_SYNC=${SKILLS_FORCE_SYNC:-0} \
        {{registry}}/{{fedora_image}}:latest

# Run coreos-agent with a shell
shell-coreos:
    podman run -it --rm \
        -v coreos-agent-config:/home/agent/.config \
        -v {{justfile_directory()}}:/workspace \
        --secret github-token \
        --entrypoint /bin/bash \
        {{registry}}/{{coreos_image}}:latest

# Run fedora-agent with a shell
shell-fedora:
    podman run -it --rm \
        -v fedora-agent-config:/home/agent/.config \
        -v {{justfile_directory()}}:/workspace \
        --secret gitea-token \
        --secret github-token \
        -e GITEA_ACCESS_TOKEN_FILE=/run/secrets/gitea-token \
        --entrypoint /bin/bash \
        {{registry}}/{{fedora_image}}:latest

# ============================================================================
# REBUILD & RUN
# ============================================================================

# Rebuild all images and run fedora-agent with forced skill sync from image
# Use this after committing skill changes to pick them up in the container
rebuild:
    @just all
    @echo "=== Rebuild complete. Starting fedora-agent with force sync... ==="
    SKILLS_FORCE_SYNC=1 just run-fedora
