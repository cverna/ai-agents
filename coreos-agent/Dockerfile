FROM ghcr.io/cverna/ai-agents-base:latest

ARG TARGETARCH

LABEL org.opencontainers.image.title="CoreOS Agent"
LABEL org.opencontainers.image.description="AI assistant for CoreOS/RHCOS infrastructure"
LABEL org.opencontainers.image.source="https://github.com/cverna/ai-agents"

USER root

RUN dnf install -y --setopt=install_weak_deps=False \
    dracut cpio zstd xz binutils elfutils bpftool dwarves vim-common \
    && dnf clean all && rm -rf /var/cache/dnf

RUN ARCH=$([ "$TARGETARCH" = "amd64" ] && echo "x86_64" || echo "arm64") && \
    VER=$(curl -fsSL https://api.github.com/repos/ankitpokhrel/jira-cli/releases/latest | jq -r '.tag_name' | sed 's/^v//') && \
    curl -fsSL "https://github.com/ankitpokhrel/jira-cli/releases/download/v${VER}/jira_${VER}_linux_${ARCH}.tar.gz" | \
    tar xz -C /tmp && mv /tmp/jira_${VER}_linux_${ARCH}/bin/jira /usr/local/bin/ && \
    rm -rf /tmp/jira_*

RUN curl -fsSL "https://github.com/cverna/coreos-agent-tools/releases/latest/download/coreos-tools-linux-${TARGETARCH}" \
    -o /usr/local/bin/coreos-tools && chmod +x /usr/local/bin/coreos-tools

RUN OC_SUFFIX=$([ "$TARGETARCH" = "amd64" ] && echo "" || echo "-arm64") && \
    curl -fsSL "https://mirror.openshift.com/pub/openshift-v4/clients/ocp/stable/openshift-client-linux${OC_SUFFIX}.tar.gz" | \
    tar xz -C /tmp && mv /tmp/oc /tmp/kubectl /usr/local/bin/ && rm -rf /tmp/*

COPY config/brew.conf /etc/koji.conf.d/brew.conf
RUN printf '#!/bin/bash\nexec koji --profile=brew "$@"\n' > /usr/local/bin/brew && chmod +x /usr/local/bin/brew

COPY opencode.json AGENTS.md /opt/opencode-config/
COPY commands/ /opt/opencode-commands/
COPY skills/ /opt/opencode-skills/
COPY agents/ /opt/opencode-agents/

USER agent
