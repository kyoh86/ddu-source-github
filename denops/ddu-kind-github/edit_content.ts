import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v5.0.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.0.1/option/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v5.0.1/autocmd/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v5.0.1/batch/mod.ts";

export async function editContent(
  denops: Denops,
  content: {
    url: string;
    body?: string | null;
  },
  opener: string,
  mods?: string,
  bang?: boolean,
) {
  const bufname = `githubissue://${content.url}`;
  const newBuffer = await buffer.open(denops, bufname, {
    opener: opener,
    mods: mods,
    bang: bang,
  });
  if (content.body) {
    await buffer.replace(denops, newBuffer.bufnr, content.body.split("\n"));
  }
  await buffer.concrete(denops, newBuffer.bufnr);
  await buffer.ensure(denops, newBuffer.bufnr, async () => {
    await batch(denops, async (denops) => {
      await option.swapfile.setLocal(denops, false);
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "acwrite");
      await option.filetype.setLocal(denops, "markdown");
      await autocmd.group(
        denops,
        "ddu_kind_github_issue_edit_internal",
        (helper) => {
          helper.remove("*", "<buffer>");
          helper.define(
            "BufWriteCmd",
            "<buffer>",
            "call denops#request(" +
              "'ddu-source-github'," +
              "'github:patch_body_from_buffer'," +
              "[" +
              `  ${newBuffer.bufnr},` +
              `  "${content.url}",` +
              `])`,
            {
              nested: true,
            },
          );
        },
      );
    });
  });
}


