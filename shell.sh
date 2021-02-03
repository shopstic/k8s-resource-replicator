#!/usr/bin/env bash
set -euo pipefail

echo "Building shell image if needed..."
(cd ./shell && docker build -f ./Dockerfile .)
IMAGE_ID=$(cd ./shell && docker build -qf ./Dockerfile .)
docker run \
  -it --rm \
  --privileged \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  -v "${HOME}/.kube:/root/.kube" \
  -v "${DENO_DIR}:/root/.cache/deno" \
  -e "DENO_DIR=/root/.cache/deno" \
  -v "${PWD}:${PWD}" \
  -w "${PWD}" \
  "${IMAGE_ID}" \
  zsh -l