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

FROM debian:stable-20210111-slim

RUN \
  apt-get update && \
  apt-get install -y procps

RUN \
  groupadd --gid 5000 app && \
  useradd --home-dir /home/app --create-home --uid 5000 \
  --gid 5000 --shell /bin/bash --skel /dev/null app

COPY --from=dumb-init /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=kubectl /usr/bin/kubectl /usr/bin/kubectl

COPY ./out/k8s-resource-replicator /home/app/k8s-resource-replicator

RUN \
  chown app:app /home/app/k8s-resource-replicator

USER app:app
WORKDIR /home/app

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["/home/app/k8s-resource-replicator"]