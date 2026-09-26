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
        install_skill https://raw.githubusercontent.com/stbenjam/skillsaw/main/.agents/skills/skillsaw-onboard skillsaw-onboard \
            SKILL.md

        install_skill https://raw.githubusercontent.com/stbenjam/skillsaw/main/.agents/skills/skillsaw-fix skillsaw-fix \
            SKILL.md

        install_skill https://raw.githubusercontent.com/ayghri/i-have-adhd/c784dcb56b07c8c103323f308b25f7b055008baa/skills/i-have-adhd i-have-adhd \
            SKILL.md

        install_skill https://raw.githubusercontent.com/hardikpandya/stop-slop/8da1f030185bdfe8471220585162991eaeb970e9 stop-slop \
            SKILL.md references/examples.md references/phrases.md references/structures.md
        ;;

    fedora)
        # Pin = ai-ml/skills-library main (0505eca) + PR #22. PR is still open, so
        # the commit lives on the cverna/skills-library fork. Re-pin to the ai-ml
        # commit once PR #22 merges.
        SHA=3ef91dcf4e78e01733be1d78e8110b59cbe92813000e4f9dd0ec3eac051fd8e8
        BASE="https://forge.fedoraproject.org/cverna/skills-library/raw/commit/${SHA}/skills"

        install_skill "$BASE/fedora-compose-triage" fedora-compose-triage \
            SKILL.md references/soname-bumps.md

        install_skill "$BASE/fedora-ftbfs-search" fedora-ftbfs-search \
            SKILL.md
        ;;

    *)
        echo "Usage: $0 {base|fedora}"
        exit 1
        ;;
esac
