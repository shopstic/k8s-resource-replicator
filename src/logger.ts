import { ConsoleStream, Logger, TokenReplacer } from "./deps/optic.ts";

export function loggerWithContext(ctx: string) {
  return new Logger()
    .addStream(
      new ConsoleStream()
        .withLogHeader(false)
        .withLogFooter(false)
        .withFormat(
          new TokenReplacer()
            .withFormat(`{dateTime} [{level}][${ctx}] {msg} {metadata}`)
            .withDateTimeFormat("YYYY-MM-DD hh:mm:ss")
            .withLevelPadding(0)
            .withColor(false),
        ),
    );
}
