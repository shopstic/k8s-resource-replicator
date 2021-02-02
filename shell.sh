#!/usr/bin/env bash
set -euo pipefail

echo "Building shell image if needed..."
IMAGE_ID=$(cd ./shell && docker build -qf ./Dockerfile .)
docker run \
  -it --rm \
  -v "${HOME}/.kube:/root/.kube" \
  -v "${DENO_DIR}:/root/.cache/deno" \
  -v "${PWD}:${PWD}" \
  -w "${PWD}" \
  "${IMAGE_ID}" \
  zsh -l