FROM shopstic/bin-dumb-init:1.2.2 as bin-dumb-init
FROM shopstic/bin-kubectl:1.20.4 as bin-kubectl

FROM debian:stable-20210111-slim

RUN \
  apt-get update && \
  apt-get install -y procps

RUN \
  groupadd --gid 5000 app && \
  useradd --home-dir /home/app --create-home --uid 5000 \
  --gid 5000 --shell /bin/bash --skel /dev/null app

COPY --from=bin-dumb-init /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=bin-kubectl /usr/bin/kubectl /usr/bin/kubectl

COPY ./k8s-resource-replicator /home/app/k8s-resource-replicator

RUN \
  chown app:app /home/app/k8s-resource-replicator

USER app:app
WORKDIR /home/app

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["/home/app/k8s-resource-replicator"]