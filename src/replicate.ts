import {
  Static,
  Type,
} from "https://raw.githubusercontent.com/shopstic/typebox/0.10.1/src/typebox.ts";
import { applyPatch } from "https://cdn.skypack.dev/fast-json-patch@3.0.0-1?dts";
import {
  inheritExec,
} from "https://raw.githubusercontent.com/shopstic/deno-utils/1.0.2/src/exec-utils.ts";
import {
  WatchCompletedPrematurely,
  WatchFailure,
  watchResources,
} from "./watch.ts";
import {
  GenericResourceWatchEventSchema,
  ReplicatedResourceSpecSchema,
} from "./schemas.ts";
import { sleep } from "./utils.ts";
import { Logger } from "https://deno.land/x/optic@1.2.2/logger/logger.ts";
import { IoK8sApimachineryPkgApisMetaV1OwnerReference } from "https://raw.githubusercontent.com/shopstic/k8s-deno-client/1.19.2/models/IoK8sApimachineryPkgApisMetaV1OwnerReference.ts";

function stripKey(event: unknown, path: string[]) {
  let key = event;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (typeof key === "object" && key !== null && segment in key) {
      key = (key as Record<string, unknown>)[segment];
    } else {
      return event;
    }
  }

  const leaf = path[path.length - 1];
  if (typeof key === "object" && key !== null && leaf in key) {
    delete (key as Record<string, unknown>)[leaf];
  }

  return event;
}

function stripResource(resource: unknown, paths: string[][]) {
  return paths.reduce((e, path) => stripKey(e, path), resource);
}

interface ReplicationConfig {
  logger: Logger;
  spec: Static<typeof ReplicatedResourceSpecSchema>;
  toNamespace: string;
  ownerReferences: Array<IoK8sApimachineryPkgApisMetaV1OwnerReference>;
  cancellation: Promise<void>;
}

async function _replicate(
  {
    logger,
    ownerReferences,
    toNamespace,
    spec: { kind, fromNamespace, fromName, toName, patches },
    cancellation,
  }: ReplicationConfig,
) {
  const fromFullName = `${kind}/${fromName}`;
  const toFullName = `${kind}/${toName}`;

  for await (
    const event of watchResources({
      fullName: fromFullName,
      namespace: fromNamespace,
      schema: GenericResourceWatchEventSchema,
      cancellation,
    })
  ) {
    if (event.type === "ADDED" || event.type === "MODIFIED") {
      const resource = event.object;

      logger.info(
        `Resource "${fromFullName}" in namespace "${fromNamespace}" changed, going to replicate to "${toFullName}" in namespace ${toNamespace}...`,
      );

      const stripped = stripResource(resource, [
        [
          "metadata",
          "annotations",
          "kubectl.kubernetes.io/last-applied-configuration",
        ],
        ["metadata", "creationTimestamp"],
        ["metadata", "generation"],
        ["metadata", "managedFields"],
        ["metadata", "resourceVersion"],
        ["metadata", "selfLink"],
        ["metadata", "uid"],
        // deno-lint-ignore no-explicit-any
      ]) as any;

      const replicated = {
        ...stripped,
        metadata: {
          ...stripped.metadata,
          name: toName,
          namespace: toNamespace,
          ownerReferences,
        },
      };

      const patched = (patches)
        ? applyPatch(replicated, patches).newDocument
        : replicated;

      await inheritExec({
        run: {
          cmd: ["kubectl", "apply", "-f", "-"],
        },
        stdin: JSON.stringify(patched),
      });
    } else {
      logger.info(
        `Resource "${fromFullName}" in namespace "${fromNamespace}" deleted, going to delete "${toFullName}" in namespace ${toNamespace}...`,
      );

      await inheritExec({
        run: {
          cmd: ["kubectl", "delete", toFullName, "-n", toNamespace],
        },
      });
    }
  }
}

export async function replicate({
  logger,
  spec,
  ...args
}: ReplicationConfig) {
  while (true) {
    try {
      await _replicate({ logger, spec, ...args });
      return;
    } catch (e) {
      if (e instanceof WatchFailure && e.stderr.trim().endsWith("not found")) {
        logger.warn(
          `Resource namespace=${spec.fromNamespace} kind=${spec.kind} name=${spec.fromName} does not (yet?) exist, going to retry in 1s`,
        );
        await sleep(1000);
      } else if (e instanceof WatchCompletedPrematurely) {
        logger.warn(
          `Watch for namespace=${spec.fromNamespace} kind=${spec.kind} name=${spec.fromName} completed prematurely, going to retry in 1s`,
        );
        await sleep(1000);
      } else {
        throw e;
      }
    }
  }
}
