FROM ghcr.io/cverna/ai-agents-base:latest

LABEL org.opencontainers.image.title="Fedora Agent"
LABEL org.opencontainers.image.description="AI assistant for Fedora compose/triage"
LABEL org.opencontainers.image.source="https://github.com/cverna/ai-agents"

USER root

ENV KRB5CCNAME=FILE:/tmp/krb5cc

RUN dnf install -y --setopt=install_weak_deps=False \
    fedora-packager krb5-workstation krb5-pkinit fedora-packager-kerberos \
    && dnf clean all && rm -rf /var/cache/dnf

RUN ARCH=$([ "$TARGETARCH" = "amd64" ] && echo "amd64" || echo "arm64") && \
    VER=$(curl -fsSL https://gitea.com/api/v1/repos/gitea/tea/releases/latest | \
          jq -r '.tag_name | ltrimstr("v")') && \
    curl -fsSL "https://gitea.com/gitea/tea/releases/download/v${VER}/tea-${VER}-linux-${ARCH}" \
    -o /usr/local/bin/tea && chmod +x /usr/local/bin/tea

COPY opencode.json AGENTS.md /opt/opencode-config/
COPY commands/ /opt/opencode-commands/
COPY skills/ /opt/opencode-skills/
COPY agents/ /opt/opencode-agents/
COPY config/tea.yml /opt/tea-config/config.yml

USER agent
