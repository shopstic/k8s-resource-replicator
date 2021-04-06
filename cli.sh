#!/usr/bin/env bash
set -euo pipefail

ci_build_in_shell() {
  local DENO_DIR=${DENO_DIR:?"DENO_DIR env variable is required"}
  local SHELL_NAME=${SHELL_NAME:?"SHELL_NAME env variable is required"}
  local GITHUB_WORKSPACE=${GITHUB_WORKSPACE:?"GITHUB_WORKSPACE env variable is required"}

  cat <<EOF | docker run \
    --workdir /repo \
    -i \
    --rm \
    -v "${GITHUB_WORKSPACE}:/repo" \
    -v "${DENO_DIR}:/root/.cache/deno" \
    -e "DENO_DIR=/root/.cache/deno" \
    "${SHELL_NAME}" \
    bash -l
set -euo pipefail

./cli.sh code_quality
./cli.sh compile
EOF

}

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