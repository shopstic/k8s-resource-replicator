#!/usr/bin/env bash
set -euo pipefail

echo "Building shell image if needed..."
(cd ./images/shell && docker build -f ./Dockerfile .)
IMAGE_ID=$(cd ./images/shell && docker build -qf ./Dockerfile .)
docker run \
  -it --rm \
  --privileged \
  --hostname=k8s-resource-replicator-shell \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  -v "${HOME}/.kube:/root/.kube" \
  -v "${DENO_DIR}:/root/.cache/deno" \
  -e "DENO_DIR=/root/.cache/deno" \
  -v "${PWD}:${PWD}" \
  -w "${PWD}" \
  "${IMAGE_ID}" \
  bash -l