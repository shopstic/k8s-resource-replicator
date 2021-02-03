#!/usr/bin/env bash
set -euo pipefail

code_quality() {
  echo "Checking formatting..."
  deno fmt --unstable --check
  echo "Linting..."
  deno lint --unstable
  # echo "Runnning tests..."
  # deno test -A
}

compile() {
  mkdir -p ./out
  deno compile -A --unstable -o ./out/k8s-resource-replicator ./src/app.ts
}

start_dev_buildkitd() {
  docker run -d --name buildkitd --privileged moby/buildkit:latest
}

build_dev_image() {
  IMAGE_NAME=${1:-"shopstic/k8s-resource-replicator"}
  IMAGE_TAG=${2:-"dev"}

  export BUILDKIT_HOST=${BUILDKIT_HOST:-"docker-container://buildkitd"}
  buildctl build \
    --frontend dockerfile.v0 \
    --local context=. \
    --local dockerfile=. \
    --output "type=docker,name=${IMAGE_NAME}:${IMAGE_TAG}" | docker load
}

build_push_image() {
  IMAGE_NAME=${1:-"shopstic/k8s-resource-replicator"}
  IMAGE_TAG=${2:-"latest"}

  export BUILDKIT_HOST=${BUILDKIT_HOST:-"docker-container://buildkitd"}
  buildctl build \
    --frontend dockerfile.v0 \
    --local context=. \
    --local dockerfile=. \
    --output "type=image,name=${IMAGE_NAME}:${IMAGE_TAG},push=true" \
    --export-cache "type=registry,ref=${IMAGE_NAME}:__buildcache__" \
    --import-cache "type=registry,ref=${IMAGE_NAME}:__buildcache__"
}

"$@"