#!/bin/bash
set -euo pipefail
DEST="${SKILLS_DIR:-/opt/opencode-skills}"

install_skill() {
    local repo=$1 ref=$2 name=$3 src=$4
    shift 4

    echo "=== Installing skill: $name ==="
    rm -rf "$DEST/$name"
    mkdir -p "$DEST/$name"

    for f; do
        mkdir -p "$(dirname "$DEST/$name/$f")"
        echo "  $f"
        curl -fsSL "https://raw.githubusercontent.com/${repo}/${ref}/${src}/${f}" -o "$DEST/$name/$f"
    done
}

install_skill stbenjam/skillsaw main skillsaw-onboard .agents/skills/skillsaw-onboard \
    SKILL.md

install_skill stbenjam/skillsaw main skillsaw-fix .agents/skills/skillsaw-fix \
    SKILL.md

install_skill ayghri/i-have-adhd c784dcb56b07c8c103323f308b25f7b055008baa i-have-adhd skills/i-have-adhd \
    SKILL.md agents/gemini.toml agents/openai.yaml

install_skill hardikpandya/stop-slop 8da1f030185bdfe8471220585162991eaeb970e9 stop-slop . \
    SKILL.md references/examples.md references/phrases.md references/structures.md
