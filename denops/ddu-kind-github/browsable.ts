import { ensure, is, maybe } from "jsr:@core/unknownutil@~4.0.0";
import type { Browsable } from "../ddu-source-github/github/types.ts";
import {
  type ActionArguments,
  ActionFlags,
  type BaseActionParams,
} from "jsr:@shougo/ddu-vim@~5.0.0/types";

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
