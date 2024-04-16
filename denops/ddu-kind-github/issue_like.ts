import type { Denops } from "https://deno.land/x/denops_std@v6.4.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.4.0/buffer/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import * as option from "https://deno.land/x/denops_std@v6.4.0/option/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v6.4.0/autocmd/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.4.0/batch/mod.ts";
import type { IssueLike } from "../ddu-source-github/github/types.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.17.3/mod.ts";
import {
  ActionArguments,
  ActionFlags,
  ActionResult,
  BaseActionParams,
} from "https://deno.land/x/ddu_vim@v3.10.3/types.ts";
import type { DduItem } from "https://deno.land/x/ddu_vim@v3.10.3/types.ts";
import type { Previewer } from "https://deno.land/x/ddu_vim@v3.10.3/types.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.10.3/base/kind.ts";
import { yank as yankCore } from "https://denopkg.com/kyoh86/denops-util@v0.0.10/yank.ts";
import { putWithSpacing } from "https://denopkg.com/kyoh86/denops-util@v0.0.10/put.ts";

export async function ensureOnlyOneItem(denops: Denops, items: DduItem[]) {
  if (items.length != 1) {
    denops.cmd;
    await denops.call(
      "ddu#util#print_error",
      "invalid action calling: it can accept only one item",
      "ddu-kind-git_commit",
    );
    return;
  }
  return items[0];
}

export async function append<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putFormat(true, args);
}

export async function appendNumber<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(true, "number", args);
}

export async function appendUrl<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(true, "html_url", args);
}

export async function appendTitle<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(true, "title", args);
}

export async function insert<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putFormat(false, args);
}

export async function insertNumber<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(false, "number", args);
}

export async function insertUrl<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(false, "html_url", args);
}

export async function insertTitle<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(false, "title", args);
}

export function evalFormat(context: Record<string, unknown>, format: string) {
  const render: () => string = new Function("return `" + format + "`").bind(
    context,
  );
  return render();
}

/**
 * Puts the formatted issue after the cursor.
 * @param after If true, put text after the cursor
 * @param {ActionArguments<T>} obj The arguments for the action.
 * @param {Denops} obj.denops The Denops instance to interact with Vim/Neovim.
 * @param {DduItem[]} obj.items The items to act on.
 * @param {unknown} obj.actionParams The parameters for the action.
 * @returns The result of the action.
 */
async function putFormat<T extends BaseActionParams>(
  after: boolean,
  { denops, items, actionParams }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const item = await ensureOnlyOneItem(denops, items);
  if (!item) {
    return ActionFlags.None;
  }
  const params = maybe(actionParams, is.Record);
  const format = maybe(params?.format, is.String) ||
    await fn.input(denops, "Format: ");
  const action = item.action as IssueLike;
  const value = evalFormat(action, format);
  if (!value) {
    return ActionFlags.None;
  }
  const avoid = maybe(
    params?.avoid,
    is.UnionOf([
      is.LiteralOf("identifier"),
      is.LiteralOf("keyword"),
      is.LiteralOf("filename"),
      is.LiteralOf("printable"),
    ]),
  );
  await putWithSpacing(denops, value, after, avoid);
  return ActionFlags.None;
}

/**
 * Puts the specified property of the issue after the cursor.
 * @param {booolean} after If true, put text after the cursor
 * @param {keyof IssueLike} property The property to put
 * @param {ActionArguments<T>} obj The arguments for the action.
 * @param {Denops} obj.denops The Denops instance to interact with Vim/Neovim.
 * @param {DduItem[]} obj.items The items to act on.
 * @returns The result of the action.
 */
async function putAny<T extends BaseActionParams>(
  after: boolean,
  property: keyof IssueLike,
  { denops, items, actionParams }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const action = (await ensureOnlyOneItem(denops, items))?.action as IssueLike;
  const params = maybe(actionParams, is.Record);
  const avoid = maybe(
    params?.avoid,
    is.UnionOf([
      is.LiteralOf("identifier"),
      is.LiteralOf("keyword"),
      is.LiteralOf("filename"),
      is.LiteralOf("printable"),
    ]),
  );
  const value = action[property];
  if (!value) {
    return ActionFlags.None;
  }
  await putWithSpacing(denops, value.toString(), after, avoid);
  return ActionFlags.None;
}

export async function yank<T extends BaseActionParams>(
  { denops, items, actionParams }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const item = await ensureOnlyOneItem(denops, items);
  if (!item) {
    return ActionFlags.None;
  }
  const params = maybe(actionParams, is.Record);
  const format = maybe(params?.format, is.String) ||
    await fn.input(denops, "Format: ");
  const action = item.action as IssueLike;
  const value = evalFormat(action, format);
  if (!value) {
    return ActionFlags.None;
  }
  await yankCore(denops, value);
  return ActionFlags.None;
}

export async function yankNumber<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await yankAny("number", args);
}

export async function yankUrl<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await yankAny("html_url", args);
}

export async function yankTitle<T extends BaseActionParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await yankAny("title", args);
}

async function yankAny<T extends BaseActionParams>(
  property: keyof IssueLike,
  { denops, items }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const action = (await ensureOnlyOneItem(denops, items))?.action as IssueLike;
  const value = action[property];
  if (!value) {
    return ActionFlags.None;
  }
  await yankCore(denops, value.toString());
  return ActionFlags.None;
}

export async function editContent<T extends BaseActionParams>(
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

  const content = item.action as IssueLike;
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
