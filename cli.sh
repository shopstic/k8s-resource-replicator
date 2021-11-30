#!/usr/bin/env bash
set -euo pipefail

code_quality() {
  echo "Checking formatting..."
  deno fmt --unstable --check ./src
  echo "Linting..."
  deno lint --unstable ./src
  # echo "Runnning tests..."
  # deno test -A
}

update_lock() {
  deno cache ./src/deps/*.ts  --lock ./lock.json --lock-write
}

bundle() {
  deno bundle --lock=lock.json ./src/app.ts > ./app.js
}

compile() {
  deno compile --lock=lock.json -A --unstable -o ./images/app/k8s-resource-replicator ./src/app.ts
}

"$@"