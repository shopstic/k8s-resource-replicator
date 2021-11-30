#!/usr/bin/env bash
set -euo pipefail

DOCKER_IMAGE="docker.io/shopstic/k8s-resource-replicator"

push_image() {
  local TAG=${1:?"Tag is required"}
  local DIGEST_FILE=$(mktemp)

  skopeo copy \
    --insecure-policy \
    --digestfile="${DIGEST_FILE}" \
    docker-archive:./result \
    docker://"${DOCKER_IMAGE}":"${TAG}" 1>&2

  cat "${DIGEST_FILE}"
}

push_multi_arch_manifest() {
  local TAG=${1:?"Tag is required"}
  shift

  local FLAGS=()

  for DIGEST in "$@"
  do
    FLAGS+=("--amend" "${DOCKER_IMAGE}@${DIGEST}")
  done

  docker manifest create "${DOCKER_IMAGE}:${TAG}" "${FLAGS[@]}" 1>&2
  docker manifest push "${DOCKER_IMAGE}:${TAG}"
}

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

release() {
  RELEASE_VERSION=${1:?"Release version is required"}

  git config --global user.email "ci-runner@shopstic.com"
  git config --global user.name "CI Runner"
  git tag -a "${RELEASE_VERSION}" -m "${RELEASE_VERSION}"
  git push origin --tags

  # gh release create "${RELEASE_VERSION}" --title "Release ${RELEASE_VERSION}" --notes "" --target "${RELEASE_VERSION}"
}

"$@"