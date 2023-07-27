import {
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.4.2/types.ts";
import type {
  Actions,
  DduItem,
  Previewer,
} from "https://deno.land/x/ddu_vim@v3.4.2/types.ts";
import type { Issue } from "../ddu-source-github/github/types.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.4.2/base/kind.ts";
import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v5.0.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.0.1/option/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v5.0.1/autocmd/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v5.0.1/batch/mod.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.2.0/mod.ts";

export type ActionData = Issue;

type Params = Record<never, never>;

async function editIssue(
  denops: Denops,
  item: DduItem,
  opener: string,
  mods?: string,
  bang?: boolean,
) {
  const action = item.action as ActionData;
  const bufname = `githubissue://${action.url}`;
  const newBuffer = await buffer.open(denops, bufname, {
    opener: opener,
    mods: mods,
    bang: bang,
  });
  if (action.body) {
    await buffer.replace(denops, newBuffer.bufnr, action.body.split("\n"));
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
              `  "${action.url}",` +
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

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: async (args) => {
      for (const item of args.items) {
        const action = item?.action as ActionData;
        await args.denops.call("ddu#kind#file#open", action.html_url);
      }
      return ActionFlags.None;
    },
    edit: async ({ denops, items, actionParams }) => {
      if (items.length != 1) {
        console.error("Invalid selection: never accept multiple items");
        return ActionFlags.None;
      }
      const params = ensure(actionParams, is.Record);

      const opener = maybe(params["opener"], is.String) ?? "tabedit";
      if (!(opener in { edit: 0, split: 0, vsplit: 0, tabedit: 0 })) {
        console.error(`Invalid opener: ${opener}`);
        return ActionFlags.None;
      }

      const mods = maybe(params["mods"], is.String);
      const bang = maybe(params["bang"], is.Boolean);
      await editIssue(denops, items[0], opener, mods, bang);
      return ActionFlags.None;
    },
  };
  override getPreviewer(
    { item }: GetPreviewerArguments,
  ): Promise<Previewer | undefined> {
    const action = item.action as ActionData;
    if (action.body) {
      return Promise.resolve({
        kind: "nofile",
        contents: action.body.split(/\r?\n/),
        syntax: "markdown",
      });
    } else {
      return Promise.resolve({
        kind: "nofile",
        contents: ["No content"],
      });
    }
  }
  params(): Params {
    return {};
  }
}
