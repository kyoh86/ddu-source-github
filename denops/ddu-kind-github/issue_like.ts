import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v5.0.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.0.1/option/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v5.0.1/autocmd/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v5.0.1/batch/mod.ts";
import type { IssueLike } from "../ddu-source-github/github/types.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.4.0/mod.ts";
import {
  ActionArguments,
  ActionFlags,
  ActionResult,
  BaseActionParams,
} from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import type { DduItem } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import type { Previewer } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/kind.ts";

async function ensureOnlyOneItem(denops: Denops, items: DduItem[]) {
  if (items.length != 1) {
    await denops.call(
      "ddu#util#print_error",
      "invalid action calling: it can accept only one item",
      "ddu-kind-git_commit",
    );
    return;
  }
  return items[0];
}

export async function openUrl<
  T extends BaseActionParams,
  U extends IssueLike,
>(
  { denops, items }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  for (const item of items) {
    const action = item?.action as U;
    await denops.call("ddu#kind#file#open", action.html_url);
  }
  return ActionFlags.None;
}

export async function editContent<
  T extends BaseActionParams,
  U extends IssueLike,
>(
  { denops, items, actionParams }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const item = await ensureOnlyOneItem(denops, items);
  if (!item) {
    return ActionFlags.None;
  }
  const params = ensure(actionParams, is.Record);

  const opener = maybe(params["opener"], is.String) ?? "tabedit";
  if (!(opener in { edit: 0, split: 0, vsplit: 0, tabedit: 0 })) {
    console.error(`Invalid opener: ${opener}`);
    return ActionFlags.None;
  }

  const content = item.action as U;
  const mods = maybe(params["mods"], is.String);
  const bang = maybe(params["bang"], is.Boolean);
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
        "ddu_kind_github_edit_issue_like",
        (helper) => {
          helper.remove("*", "<buffer>");
          helper.define(
            "BufWriteCmd",
            "<buffer>",
            "call ddu#kind#github#request#patch_body(" +
              `${newBuffer.bufnr},` +
              `"${content.url}",` +
              ")",
            {
              nested: true,
            },
          );
        },
      );
    });
  });
  return ActionFlags.None;
}

export function getPreviewer<T extends IssueLike>(
  { item }: GetPreviewerArguments,
): Promise<Previewer | undefined> {
  const action = item.action as T;
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
