#!/bin/bash
# Sync OpenCode config files from /opt to ~/.config
# This runs on every container start to ensure latest files are available

mkdir -p "$HOME/.config/opencode"

if [ -f /opt/opencode-config/opencode.json ]; then
    cp /opt/opencode-config/opencode.json "$HOME/.config/opencode/"
fi

if [ -f /opt/opencode-config/AGENTS.md ]; then
    cp /opt/opencode-config/AGENTS.md "$HOME/.config/opencode/"
fi

if [ -d /opt/opencode-commands ]; then
    mkdir -p "$HOME/.config/opencode/commands"
    cp /opt/opencode-commands/*.md "$HOME/.config/opencode/commands/" 2>/dev/null || true
fi

if [ -d /opt/opencode-skills ]; then
    mkdir -p "$HOME/.config/opencode/skills"
    cp -r /opt/opencode-skills/* "$HOME/.config/opencode/skills/" 2>/dev/null || true
fi

if [ -d /opt/opencode-agents ]; then
    mkdir -p "$HOME/.config/opencode/agents"
    cp /opt/opencode-agents/*.md "$HOME/.config/opencode/agents/" 2>/dev/null || true
fi

exec "$@"
