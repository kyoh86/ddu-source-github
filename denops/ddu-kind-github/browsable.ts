import type { Browsable } from "../ddu-source-github/github/types.ts";
import {
  ActionArguments,
  ActionFlags,
  ActionResult,
  BaseActionParams,
} from "https://deno.land/x/ddu_vim@v3.8.1/types.ts";

export async function openUrl<
  T extends BaseActionParams,
  U extends Browsable,
>(
  { denops, items }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  for (const item of items) {
    const action = item?.action as U;
    await denops.call("ddu#kind#file#open", action.html_url);
  }
  return ActionFlags.None;
}
