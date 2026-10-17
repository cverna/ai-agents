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
        # Pin = cverna/skills-library branch fedora-compose-triage-references
        # (1a37914), the live-run hardening of fedora-compose-triage. It adds
        # four references and an asset, so the file list below must name every
        # one of them or SKILL.md's links dangle. Re-pin to ai-ml main once
        # that branch is merged.
        SHA=1a3791446db3fc295286cab11710ca98c041fb480085555161d26d2a6a3d4a2f
        BASE="https://forge.fedoraproject.org/cverna/skills-library/raw/commit/${SHA}/skills"

        install_skill "$BASE/fedora-compose-triage" fedora-compose-triage \
            SKILL.md \
            references/error-patterns.md \
            references/koji-bodhi-commands.md \
            references/pungi-tooling-failures.md \
            references/soname-bumps.md \
            assets/stage7-example.md

        install_skill "$BASE/fedora-ftbfs-search" fedora-ftbfs-search \
            SKILL.md
        ;;

    *)
        echo "Usage: $0 {base|fedora}"
        exit 1
        ;;
esac
