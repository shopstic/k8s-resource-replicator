FROM shopstic/bin-dumb-init:1.2.2 as bin-dumb-init
FROM shopstic/bin-kubectl:1.20.4 as bin-kubectl
FROM shopstic/bin-deno:1.8.3 as bin-deno
FROM shopstic/bin-helm:3.5.3 as bin-helm
FROM shopstic/bin-yq:4.6.3 as bin-yq


# kube-ps1 ------------------------------------------------------------------
FROM shopstic/curl-tar-unzip:1.0.1 as kube-ps1

ENV KUBE_PS1_VERSION "0.7.0"

RUN \
  curl -Lo /root/kube-ps1.sh https://raw.githubusercontent.com/jonmosco/kube-ps1/v${KUBE_PS1_VERSION}/kube-ps1.sh

FROM ubuntu:20.04

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV TERM=xterm-256color

RUN \
  apt update && apt install -y ca-certificates

COPY --from=bin-dumb-init /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=bin-kubectl /usr/bin/kubectl /usr/bin/kubectl
COPY --from=bin-helm /usr/bin/helm /usr/bin/helm
COPY --from=bin-deno /usr/bin/deno /usr/bin/deno
COPY --from=bin-yq /usr/bin/yq /usr/bin/yq
COPY --from=kube-ps1 /root/kube-ps1.sh /root/kube-ps1.sh

COPY ./.profile /root/.profile

ENTRYPOINT ["/usr/bin/dumb-init", "--"]