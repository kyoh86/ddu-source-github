import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.2.0/mod.ts";
import { getClient } from "../../github/client.ts";
import {
  getbufline,
  setbufvar,
} from "https://deno.land/x/denops_std@v5.0.1/function/mod.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,

    "github:patch_body": async (unknownBufnr, unknownUrl) => {
      const bufnr = ensure(unknownBufnr, is.Number, {
        message: "bufnr must be number",
      });
      const url = ensure(unknownUrl, is.String, {
        message: "url must be string",
      });

      const bodyLines = await getbufline(denops, bufnr, 1, "$");
      const u = new URL(url);
      const client = await getClient(u.hostname);
      await client.request({
        url,
        method: "patch",
        body: bodyLines.join("\n"),
      });
      await setbufvar(denops, bufnr, "&modified", 0);
      return url;
    },
  };
}
