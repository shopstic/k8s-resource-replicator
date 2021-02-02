import { ConsoleStream, Logger } from "https://deno.land/x/optic@1.2.2/mod.ts";
import { TokenReplacer } from "https://deno.land/x/optic@1.2.2/formatters/tokenReplacer.ts";

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
