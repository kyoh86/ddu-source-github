import { ensure, is, maybe } from "jsr:@core/unknownutil@~4.3.0";
import type { Browsable } from "../ddu-source-github/github/types.ts";
import {
  type ActionArguments,
  ActionFlags,
  type BaseParams,
} from "jsr:@shougo/ddu-vim@~7.0.0/types";

export async function openUrl<T extends BaseParams, U extends Browsable>(
  { denops, items, actionParams }: ActionArguments<T>,
) {
  const params = ensure(actionParams, is.Record);
  const opener = maybe(params.opener, is.String);
  for (const item of items) {
    const action = item?.action as U;
    await denops.call("denops#notify", "ddu-source-github", "browse", [
      action.html_url,
      opener,
    ]);
  }
  return ActionFlags.None;
}
