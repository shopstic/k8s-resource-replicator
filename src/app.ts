import { loggerWithContext } from "./logger.ts";
import { replicate } from "./replicate.ts";
import { ReplicatedResourceWatchEventSchema } from "./schemas.ts";
import { WatchCompletedPrematurely, watchResources } from "./watch.ts";
import { IoK8sApimachineryPkgApisMetaV1OwnerReference } from "./deps/k8s-utils.ts";
import { sleep } from "./utils.ts";

const logger = loggerWithContext("main");

class ProcessInterruptedError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ProcessInterruptedError.prototype);
  }
}

function waitForSignal(signal: "SIGINT" | "SIGTERM"): Promise<string> {
  return new Promise((resolve) => {
    function listener() {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      Deno.removeSignalListener(signal, listener);
      resolve(signal);
    }

    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    Deno.addSignalListener(signal, listener);
  });
}

async function waitForExitSignal(): Promise<void> {
  const signal = await Promise.race([
    waitForSignal("SIGINT"),
    waitForSignal("SIGTERM"),
  ]);

  throw new ProcessInterruptedError(`Process interrupted with ${signal}`);
}

function createCancellation(): [Promise<void>, () => void] {
  let callback: () => void = () => {};

  const promise = new Promise<void>((r) => {
    callback = r;
  });

  return [promise, callback];
}

interface ActiveReplication {
  name: string;
  promise: Promise<void>;
  cancel: () => void;
}

const activeReplicationMap: Map<string, ActiveReplication> = new Map();

async function watchAndReconcile() {
  for await (
    const event of watchResources({
      fullName: "replicatedresource",
      schema: ReplicatedResourceWatchEventSchema,
      cancellation: waitForExitSignal(),
    })
  ) {
    logger.debug("Got event", event);
    const object = event.object;
    const uid = object.metadata.uid;
    const maybeCurrentReplication = activeReplicationMap.get(uid);

    if (maybeCurrentReplication) {
      activeReplicationMap.delete(uid);
      logger.info(
        `Cancelling current replication: ${maybeCurrentReplication.name}`,
      );
      maybeCurrentReplication.cancel();
      await maybeCurrentReplication.promise;
    }

    if (event.type === "ADDED" || event.type === "MODIFIED") {
      const replicationName =
        `${object.metadata.namespace}/${object.metadata.name}`;
      logger.info(`Creating replication: ${replicationName}`);

      const [cancellation, cancel] = createCancellation();

      const ownerReferences: IoK8sApimachineryPkgApisMetaV1OwnerReference[] = [
        {
          apiVersion: object.apiVersion,
          kind: object.kind,
          name: object.metadata.name,
          controller: true,
          uid,
        },
      ];

      const promise = replicate({
        logger: loggerWithContext(replicationName),
        ownerReferences,
        toNamespace: object.metadata.namespace,
        spec: object.spec,
        cancellation,
      });

      activeReplicationMap.set(uid, {
        name: replicationName,
        promise,
        cancel,
      });
    }
  }
}

async function main() {
  while (true) {
    try {
      await watchAndReconcile();
    } catch (e) {
      if (e instanceof WatchCompletedPrematurely) {
        logger.warn(
          `Watch for replicated resources completed prematurely, going to retry in 1s`,
        );
        await sleep(1000);
      } else if (e instanceof ProcessInterruptedError) {
        logger.warn(e.message);
        return;
      } else {
        throw e;
      }
    }
  }
}

try {
  logger.info("Resource replicator started!");
  await main();
  Deno.exit(0);
} catch (e) {
  logger.critical(e);
  Deno.exit(1);
}
