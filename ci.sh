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
  deno compile -A --unstable -o ./images/app/k8s-resource-replicator ./src/app.ts
}

"$@"