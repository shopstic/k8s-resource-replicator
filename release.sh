#!/usr/bin/env bash
set -euo pipefail

push_helm_chart() {
  export HELM_CHART_VERSION=${1:?"Helm chart version is required"}
  export HELM_APP_VERSION=${2:?"Helm chart app version is required"}
  export HELM_CHART_REF=${3:?"Helm chart ref is required"}

  export HELM_EXPERIMENTAL_OCI=1
  export HELM_REGISTRY_CONFIG="${HOME}"/.docker/config.json

  local OUT
  OUT=$(mktemp -d)
  trap "rm -Rf ${OUT}" EXIT

  cp -R ./charts/resource-replicator "${OUT}/"

  yq e '.version = env(HELM_CHART_VERSION)' -i "${OUT}/resource-replicator/Chart.yaml"
  yq e '.appVersion = env(HELM_APP_VERSION)' -i "${OUT}/resource-replicator/Chart.yaml"

  helm package --app-version "${HELM_APP_VERSION}" "${OUT}/resource-replicator" -d "${OUT}/packaged"
  helm push "${OUT}/packaged/resource-replicator-${HELM_CHART_VERSION}.tgz" "${HELM_CHART_REF}"
}

"$@"