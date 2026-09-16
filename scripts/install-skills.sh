#!/bin/bash
set -euo pipefail
DEST="${SKILLS_DIR:-/opt/opencode-skills}"

install_skill() {
    local raw_base=$1 name=$2
    shift 2

    echo "=== Installing skill: $name ==="
    rm -rf "$DEST/$name"
    mkdir -p "$DEST/$name"

    for f; do
        mkdir -p "$(dirname "$DEST/$name/$f")"
        echo "  $f"
        curl -fsSL "${raw_base}/${f}" -o "$DEST/$name/$f"
    done
}

case "${1:-base}" in
    base)
        install_skill https://raw.githubusercontent.com/stbenjam/skillsaw/81e21e7a17691db903381f3974bc8504b9af129a/.agents/skills/skillsaw-onboard skillsaw-onboard \
            SKILL.md

        install_skill https://raw.githubusercontent.com/stbenjam/skillsaw/81e21e7a17691db903381f3974bc8504b9af129a/.agents/skills/skillsaw-fix skillsaw-fix \
            SKILL.md

        install_skill https://raw.githubusercontent.com/ayghri/i-have-adhd/0a84de401019a3a822248df586d88a2b56f8c6af/skills/i-have-adhd i-have-adhd \
            SKILL.md

        install_skill https://raw.githubusercontent.com/hardikpandya/stop-slop/8da1f030185bdfe8471220585162991eaeb970e9 stop-slop \
            SKILL.md references/examples.md references/phrases.md references/structures.md
        ;;

    fedora)
        install_skill https://forge.fedoraproject.org/ai-ml/skills-library/raw/commit/587d4e67d8e23b365e41410a088be5c9d443ff1df037331bb3a4f869a1bd91b0/skills/fedora-compose-triage fedora-compose-triage \
            SKILL.md references/soname-bumps.md

        install_skill https://forge.fedoraproject.org/ai-ml/skills-library/raw/commit/587d4e67d8e23b365e41410a088be5c9d443ff1df037331bb3a4f869a1bd91b0/skills/fedora-ftbfs-search fedora-ftbfs-search \
            SKILL.md
        ;;

    *)
        echo "Usage: $0 {base|fedora}"
        exit 1
        ;;
esac
