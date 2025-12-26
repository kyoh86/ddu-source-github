import type { Denops } from "@denops/std";
import { ensure, is } from "@core/unknownutil";
import { authenticate, getClient } from "./github/client.ts";
import { getbufline, setbufvar } from "@denops/std/function";
import { systemopen } from "@lambdalisue/systemopen";
import {
  isGitHubAppAuthentication,
  storeAuthentication,
} from "./github/auth.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,

    async patch_body(unknownBufnr, unknownUrl) {
      const bufnr = ensure(unknownBufnr, is.Number, {
        message: "bufnr must be number",
      });
      const url = ensure(unknownUrl, is.String, {
        message: "url must be string",
      });

      const bodyLines = await getbufline(denops, bufnr, 1, "$");
      const client = await getClient();
      await client.request({
        url,
        method: "patch",
        body: bodyLines.join("\n"),
      });
      await setbufvar(denops, bufnr, "&modified", 0);
      return url;
    },

    async login(uForce) {
      const force = ensure(uForce, is.UnionOf([is.Boolean, is.Undefined]));
      return await authenticate(force);
    },

    async ensure_login(uAuthentication) {
      const authentication = ensure(uAuthentication, isGitHubAppAuthentication);
      await storeAuthentication(authentication);
    },

    async browse(uUrl: unknown, uOpener?: unknown) {
      const url = ensure(uUrl, is.String);
      const opener = ensure(uOpener, is.UnionOf([is.String, is.Undefined]));
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
