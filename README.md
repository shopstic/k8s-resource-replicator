# Kubernetes Resource Replicator

[![CI](https://github.com/shopstic/k8s-resource-replicator/actions/workflows/ci.yaml/badge.svg)](https://github.com/shopstic/k8s-resource-replicator/actions)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/shopstic/k8s-resource-replicator/blob/main/LICENSE)
[![Docker](https://img.shields.io/docker/v/shopstic/k8s-resource-replicator?arch=amd64&color=%23ab47bc&label=Docker%20Image&sort=date)](https://hub.docker.com/repository/docker/shopstic/k8s-resource-replicator/tags?page=1&ordering=last_updated)

A very lean and fast Kubernetes operator which enables replication of resources
(e.g `ConfigMap`, `Secret`, etc.) across namespaces. It also supports
[JSON Patch](http://jsonpatch.com/) operations to allow transformation of the
payload with ease.

Example of a CRD instance:

```yaml
apiVersion: shopstic.com/v1
kind: ReplicatedResource
metadata:
  name: foo-secret-replication
  namespace: bar
spec:
  kind: secret
  fromNamespace: foo
  fromName: some-foo-secret
  toName: some-bar-secret
  patches:
    - op: replace
      path: "/stringData/one"
      value: replaced_one
    - op: add
      path: "/stringData/ten"
      value: added_ten
    - op: move
      from: "/stringData/three"
      path: "/stringData/moved_three_again_here"
    - op: render
      path: "/stringData/templated"
      template: |-
        copy_of_one: {{stringData.one}}
        copy_of_ten: {{stringData.ten}}
        something_else: whatever_here
      replace: false
```

Which will replicate a Secret named `some-foo-secret` from namespace `foo` to a
Secret named `some-bar-secret` in namespace `bar` (the same namespace where this
`ReplicatedResource` instance is created), while performing some transformations
as specified as JSON Patch operations. Replication reacts almost instantaneously
to any changes by leveraging "watch" capability of Kubernetes APIs.
