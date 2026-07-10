FROM ghcr.io/cverna/ai-agents-base:latest

LABEL org.opencontainers.image.title="Fedora Agent"
LABEL org.opencontainers.image.description="AI assistant for Fedora compose/triage"
LABEL org.opencontainers.image.source="https://github.com/cverna/ai-agents"

USER root

ENV KRB5CCNAME=FILE:/tmp/krb5cc

RUN dnf install -y --setopt=install_weak_deps=False \
    fedora-packager krb5-workstation krb5-pkinit fedora-packager-kerberos fedora-review \
    golang go2rpm \
    && dnf clean all && rm -rf /var/cache/dnf

ARG TARGETARCH
RUN ARCH=$([ "$TARGETARCH" = "amd64" ] && echo "x86_64" || echo "arm64") && \
    VER=$(curl -fsSL https://gitea.com/api/v1/repos/gitea/gitea-mcp/releases/latest | \
          jq -r '.tag_name | ltrimstr("v")') && \
    curl -fsSL "https://gitea.com/gitea/gitea-mcp/releases/download/v${VER}/gitea-mcp_Linux_${ARCH}.tar.gz" \
    | tar -xz -C /usr/local/bin gitea-mcp && chmod +x /usr/local/bin/gitea-mcp

RUN git clone --depth=1 --filter=blob:none --sparse \
        https://forge.fedoraproject.org/ai-ml/skills-library.git /tmp/skills-library && \
    cd /tmp/skills-library && \
    git sparse-checkout set skills && \
    cp -r skills/* /opt/opencode-skills/ && \
    rm -rf /tmp/skills-library

# Overlay local skill patches — files here override upstream versions.
# Remove when upstream merges the corresponding PR.
COPY skills/ /opt/opencode-skills/

COPY opencode.json AGENTS.md /opt/opencode-config/
COPY commands/ /opt/opencode-commands/
COPY agents/ /opt/opencode-agents/

USER agent
