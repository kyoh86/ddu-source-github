import type { Denops } from "jsr:@denops/std@7.6.0";
import * as buffer from "jsr:@denops/std@7.6.0/buffer";
import * as option from "jsr:@denops/std@7.6.0/option";
import * as autocmd from "jsr:@denops/std@7.6.0/autocmd";
import { batch } from "jsr:@denops/std@7.6.0/batch";
import type { IssueLike } from "../ddu-source-github/github/types.ts";
import { ensure, is, maybe } from "jsr:@core/unknownutil@4.3.0";
import {
  type ActionArguments,
  ActionFlags,
  type ActionResult,
  type BaseParams,
  type DduItem,
  type Previewer,
} from "jsr:@shougo/ddu-vim@10.3.0/types";
import type { GetPreviewerArguments } from "jsr:@shougo/ddu-vim@10.3.0/kind";
import { yank as yankCore } from "jsr:@kyoh86/denops-util@0.1.1/yank";
import { putWithSpacing, type Spacer, type SpacingType } from "./put.ts";
import { match } from "jsr:@denops/std@7.6.0/function";

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

export async function append<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putFormat(true, args);
}

export async function appendNumber<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(true, "number", args);
}

export async function appendUrl<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(true, "html_url", args);
}

export async function appendTitle<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(true, "title", args);
}

export async function insert<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putFormat(false, args);
}

export async function insertNumber<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(false, "number", args);
}

export async function insertUrl<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(false, "html_url", args);
}

export async function insertTitle<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await putAny(false, "title", args);
}

function makeFormatter(
  denops: Denops,
  params: Record<PropertyKey, unknown> | undefined,
) {
  if (params && "formatter" in params) {
    return async (action: IssueLike) => {
      return ensure(
        await denops.call(
          "denops#callback#call",
          params.formatter,
          action,
        ),
        is.String,
      );
    };
  } else if (params && "format" in params) {
    return (action: IssueLike) =>
      Promise.resolve(
        (new Function("return `" + params.format + "`").bind(action))(),
      );
  } else {
    return (action: IssueLike) => Promise.resolve(action.title);
  }
}

/**
 * Creates a regex pattern based on the given spacing pattern.
 * @param spacing The class to create a pattern for.
 * @returns The regex pattern as a string.
 */
function getSpacingPattern(
  spacing: SpacingType | undefined,
): string | undefined {
  switch (spacing) {
    case "identifier":
      return "\\i";
    case "keyword":
      return "\\k";
    case "filename":
      return "\\f";
    case "printable":
      return "\\p";
  }
  return undefined;
}

function makeSpacer(
  denops: Denops,
  params: Record<PropertyKey, unknown> | undefined,
): Spacer | undefined {
  if (params && "spacer" in params) {
    return async (char: string, after: boolean) =>
      ensure(
        await denops.call(
          "denops#callback#call",
          params.spacer,
          char,
          after,
        ),
        is.Number,
      );
  } else if (params && ("spacing" in params || "avoid" in params)) {
    const method = maybe(
      params.spacing ?? params.avoid,
      is.UnionOf([
        is.LiteralOf("identifier"),
        is.LiteralOf("keyword"),
        is.LiteralOf("filename"),
        is.LiteralOf("printable"),
      ]),
    );
    if (method) {
      return undefined;
    }
    const pattern = getSpacingPattern(method);
    if (!pattern) {
      return undefined;
    }
    return async (char: string, _: boolean) => {
      return (await match(denops, char, pattern) >= 0) ? 1 : 0;
    };
  }
  return undefined;
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
async function putFormat<T extends BaseParams>(
  after: boolean,
  { denops, items, actionParams, context }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const params = ensure(actionParams, is.UnionOf([is.Record, is.Undefined]));
  const formatter = makeFormatter(denops, params);
  const spacer = makeSpacer(denops, params);
  let nl = "";
  for (const item of items) {
    const action = item.action as IssueLike;
    const value = await formatter(action);
    if (!value) {
      continue;
    }
    await putWithSpacing(
      denops,
      context.bufNr,
      `${nl}${value}`,
      after,
      spacer,
    );
    nl = "\n";
  }
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
async function putAny<T extends BaseParams>(
  after: boolean,
  property: keyof IssueLike,
  { denops, items, actionParams, context }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const params = maybe(actionParams, is.Record);
  const spacer = makeSpacer(denops, params);
  let nl = "";
  for (const item of items) {
    const action = item.action as IssueLike;
    const value = property == "repository"
      ? action[property]?.full_name
      : action[property];
    if (!value) {
      continue;
    }
    await putWithSpacing(
      denops,
      context.bufNr,
      `${nl}${value}`,
      after,
      spacer,
    );
    nl = "\n";
  }
  return ActionFlags.None;
}

export async function yank<T extends BaseParams>(
  { denops, items, actionParams }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const params = maybe(actionParams, is.Record);
  const formatter = makeFormatter(denops, params);
  const text = (
    await Promise.all(items.map(async (item) => {
      const action = item.action as IssueLike;
      return await formatter(action);
    }))
  ).filter((value) => !!value).join("\n");
  await yankCore(denops, text);
  return ActionFlags.None;
}

export async function yankNumber<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await yankAny("number", args);
}

export async function yankUrl<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await yankAny("html_url", args);
}

export async function yankTitle<T extends BaseParams>(
  args: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  return await yankAny("title", args);
}

async function yankAny<T extends BaseParams>(
  property: keyof IssueLike,
  { denops, items }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  const text = items.map((item) => {
    const action = item.action as IssueLike;
    return property == "repository"
      ? action[property]?.full_name
      : action[property];
  }).filter((value) => !!value).join("\n");
  await yankCore(denops, text);
  return ActionFlags.None;
}

export async function editContent<T extends BaseParams>(
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
