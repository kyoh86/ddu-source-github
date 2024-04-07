import { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.17.2/mod.ts";
import { systemopen } from "https://deno.land/x/systemopen@v1.0.0/mod.ts";

export function main(denops: Denops) {
  denops.dispatcher = {
    async open(uUrl: unknown, uOpener?: unknown) {
      const url = ensure(uUrl, is.String);
      const opener = maybe(uOpener, is.String);
      if (opener) {
        const command = new Deno.Command(opener, {
          args: [url],
          stdin: "null",
          stdout: "null",
          stderr: "null",
        });
        const proc = command.spawn();
        await proc.status;
      } else {
        await systemopen(url);
      }
    },
  };
}
