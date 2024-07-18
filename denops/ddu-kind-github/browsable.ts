import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.18.1/mod.ts";
import type { Browsable } from "../ddu-source-github/github/types.ts";
import {
  type ActionArguments,
  ActionFlags,
  type BaseActionParams,
} from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";

export async function openUrl<T extends BaseActionParams, U extends Browsable>(
  { denops, items, actionParams }: ActionArguments<T>,
) {
  const params = ensure(actionParams, is.Record);
  const opener = maybe(params.opener, is.String);
  for (const item of items) {
    const action = item?.action as U;
    await denops.call("denops#notify", "ddu-kind-github", "open", [
      action.html_url,
      opener,
    ]);
  }
  return ActionFlags.None;
}
