#!/bin/bash
set -euo pipefail

SKILLS_DIR="${SKILLS_DIR:-/opt/opencode-skills}"

declare -A SKILLS

SKILLS["stbenjam/skillsaw|main|.agents/skills/skillsaw-onboard"]="skillsaw-onboard"
SKILLS["stbenjam/skillsaw|main|.agents/skills/skillsaw-fix"]="skillsaw-fix"
SKILLS["ayghri/i-have-adhd|c784dcb56b07c8c103323f308b25f7b055008baa|skills/i-have-adhd"]="i-have-adhd"
SKILLS["hardikpandya/stop-slop|8da1f030185bdfe8471220585162991eaeb970e9|."]="stop-slop"

mkdir -p "$SKILLS_DIR"

install_skill() {
    local repo="$1"
    local ref="$2"
    local src_path="$3"
    local name="$4"

    echo "=== Installing skill: $name (${repo}@${ref}) ==="

    local dest="$SKILLS_DIR/$name"
    rm -rf "$dest"
    mkdir -p "$dest"

    local tree_json
    tree_json=$(curl -fsSL "https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1")

    local files
    files=$(echo "$tree_json" | jq -r '.tree[] | select(.type == "blob") | .path')

    if [ "$src_path" = "." ]; then
        files=$(echo "$files" | grep -v '/')
        local subdir_files
        subdir_files=$(echo "$tree_json" | jq -r '.tree[] | select(.type == "blob") | .path' | grep '/' || true)
        files=$(printf '%s\n%s' "$files" "$subdir_files" | sort -u)
    else
        files=$(echo "$files" | grep "^${src_path}/" || true)
    fi

    if [ -z "$files" ]; then
        echo "ERROR: no files found for $name (repo=$repo, ref=$ref, path=$src_path)"
        exit 1
    fi

    while IFS= read -r f; do
        [ -z "$f" ] && continue

        local rel_path
        if [ "$src_path" = "." ]; then
            rel_path="$f"
        else
            rel_path="${f#$src_path/}"
        fi

        local file_dest="$dest/$rel_path"
        mkdir -p "$(dirname "$file_dest")"

        echo "  $rel_path"
        curl -fsSL "https://raw.githubusercontent.com/${repo}/${ref}/${f}" -o "$file_dest"
    done <<< "$files"

    echo "=== Installed $name ($(echo "$files" | wc -l) files) ==="
}

for key in "${!SKILLS[@]}"; do
    IFS='|' read -r repo ref src_path <<< "$key"
    install_skill "$repo" "$ref" "$src_path" "${SKILLS[$key]}"
done

echo "=== All skills installed ==="
