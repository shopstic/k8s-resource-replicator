import { readLines } from "https://deno.land/std@0.85.0/io/bufio.ts";
import { validate } from "https://raw.githubusercontent.com/shopstic/deno-utils/1.0.2/src/validation-utils.ts";
import {
  Static,
  TStatic,
} from "https://raw.githubusercontent.com/shopstic/typebox/0.10.1/src/typebox.ts";

export class WatchFailure extends Error {
  constructor(public stderr: string, message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WatchCompletedPrematurely extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export async function* watchResources<S extends TStatic>(
  { fullName, namespace, schema, cancellation }: {
    schema: S;
    fullName: string;
    namespace: string;
    cancellation: Promise<void>;
  },
): AsyncIterableIterator<Static<S>> {
  const watchCmd = [
    "kubectl",
    "get",
    fullName,
    "-n",
    namespace,
    "--watch",
    "--output-watch-events",
    `-o=jsonpath={@}{"\\n"}`,
  ];

  const watchProcess = Deno.run({
    cmd: watchCmd,
    stdout: "piped",
    stderr: "piped",
  });

  let isCancelled = false;

  try {
    let lastPayload = null;

    cancellation.finally(() => {
      isCancelled = true;
      watchProcess.close();
    });

    for await (const payload of readLines(watchProcess.stdout!)) {
      if (payload.length === 0 || payload === lastPayload) {
        continue;
      }

      lastPayload = payload;

      const parsed = (() => {
        try {
          return JSON.parse(payload);
        } catch (e) {
          throw new Error(
            `Failed parsing payload as JSON, reason: ${e.message}. Original payload: ${payload}`,
          );
        }
      })();

      const result = validate(schema, parsed);

      if (!result.isSuccess) {
        throw new Error(
          `Failed validating result as a valid k8s watch event. 
Raw payload: 
-------------------------------------------------------
${JSON.stringify(parsed, null, 2)}
-------------------------------------------------------
${JSON.stringify(result.errors, null, 2)}
`,
        );
      }

      yield result.value;
    }

    if (isCancelled) {
      return;
    }

    const { code } = await watchProcess.status();

    if (code !== 0) {
      const stderrPayload = new TextDecoder().decode(
        await Deno.readAll(watchProcess.stderr!),
      );

      throw new WatchFailure(
        stderrPayload,
        `Watch child process return non-zero status of ${code}.
${watchCmd.join(" ")}
-------------------------------------------------------------
${stderrPayload.length > 0 ? stderrPayload : "<Empty stderr>"}
-------------------------------------------------------------`,
      );
    } else {
      throw new WatchCompletedPrematurely(
        `Watch child process completed prematurely`,
      );
    }
  } finally {
    watchProcess.stderr!.close();
    watchProcess.stdout!.close();
    if (!isCancelled) {
      watchProcess.close();
    }
  }
}
