FROM ghcr.io/cverna/ai-agents-base:latest

LABEL org.opencontainers.image.title="Fedora Agent"
LABEL org.opencontainers.image.description="AI assistant for Fedora compose/triage"
LABEL org.opencontainers.image.source="https://github.com/cverna/ai-agents"

USER root

ENV KRB5CCNAME=FILE:/tmp/krb5cc

RUN dnf install -y --setopt=install_weak_deps=False \
    fedora-packager krb5-workstation krb5-pkinit fedora-packager-kerberos \
    && dnf clean all && rm -rf /var/cache/dnf

COPY opencode.json AGENTS.md /opt/opencode-config/
COPY commands/ /opt/opencode-commands/
COPY skills/ /opt/opencode-skills/
COPY agents/ /opt/opencode-agents/

USER agent
