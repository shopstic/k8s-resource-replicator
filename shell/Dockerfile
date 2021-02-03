FROM shopstic/curl-tar-unzip:1.0.1 as dumb-init

ENV DUMB_INIT_VERSION "1.2.2"

RUN \
  curl -Lo /usr/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v${DUMB_INIT_VERSION}/dumb-init_${DUMB_INIT_VERSION}_amd64 && \
  chmod +x /usr/bin/dumb-init

FROM shopstic/curl-tar-unzip:1.0.1 as kubectl

ENV K8S_VERSION "1.19.7"

RUN \
  curl -Lo /usr/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/v${K8S_VERSION}/bin/linux/amd64/kubectl && \
  chmod +x /usr/bin/kubectl

# helm ------------------------------------------------------------------
FROM shopstic/curl-tar-unzip:1.0.1 as helm

ENV HELM_VERSION "3.5.1"

RUN \
  mkdir -p /tmp/helm && \
  curl -L https://get.helm.sh/helm-v${HELM_VERSION}-linux-amd64.tar.gz | tar -xz -C /tmp/helm --strip-components=1 && \
  mv /tmp/helm/helm /usr/bin/helm && \
  chmod +x /usr/bin/helm && \
  rm -Rf /tmp/helm

# helm ------------------------------------------------------------------
FROM shopstic/curl-tar-unzip:1.0.1 as buildkit

ENV BUILDKIT_VERSION "0.8.1"

RUN \
  mkdir -p /tmp/buildkit && \
  curl -L https://github.com/moby/buildkit/releases/download/v${BUILDKIT_VERSION}/buildkit-v${BUILDKIT_VERSION}.linux-amd64.tar.gz | tar -xz -C /tmp/buildkit --strip-components=1 && \
  ls -la /tmp/buildkit/ && \
  mv /tmp/buildkit/buildctl /usr/bin/buildctl && \
  mv /tmp/buildkit/buildkitd /usr/bin/buildkitd && \
  mv /tmp/buildkit/buildkit-runc /usr/bin/buildkit-runc && \
  rm -Rf /tmp/buildkit

# kube-ps1 ------------------------------------------------------------------
FROM shopstic/curl-tar-unzip:1.0.1 as kube-ps1

ENV KUBE_PS1_VERSION "0.7.0"

RUN \
  curl -Lo /root/kube-ps1.sh https://raw.githubusercontent.com/jonmosco/kube-ps1/v${KUBE_PS1_VERSION}/kube-ps1.sh

# deno ------------------------------------------------------------------
FROM shopstic/curl-tar-unzip:1.0.1 as deno

ENV DENO_VERSION "1.7.1"

RUN \
  curl -fsSL https://deno.land/x/install/install.sh | sh -s v${DENO_VERSION}

FROM ubuntu:18.04

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV TERM=xterm-256color

RUN \
  apt-get update && \
  apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg-agent \
  software-properties-common \
  apt-transport-https \
  gnupg2 \
  zsh && \
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - && \
  add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable" && \
  apt-get install -y docker-ce-cli && \
  rm -rf /var/lib/apt/lists/*

COPY --from=dumb-init /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=kubectl /usr/bin/kubectl /usr/bin/kubectl
COPY --from=helm /usr/bin/helm /usr/bin/helm
COPY --from=kube-ps1 /root/kube-ps1.sh /root/kube-ps1.sh
COPY --from=buildkit /usr/bin/buildctl /usr/bin/buildctl
COPY --from=buildkit /usr/bin/buildkitd /usr/bin/buildkitd
COPY --from=deno /root/.deno /root/.deno

ADD ./.zshrc /root/.zshrc

ENTRYPOINT ["/usr/bin/dumb-init", "--"]