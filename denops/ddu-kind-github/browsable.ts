import type { Browsable } from "../ddu-source-github/github/types.ts";
import {
  ActionArguments,
  ActionFlags,
  ActionResult,
  BaseActionParams,
} from "https://deno.land/x/ddu_vim@v3.9.0/types.ts";
import { systemopen } from "https://deno.land/x/systemopen@v0.2.0/mod.ts";

export async function openUrl<T extends BaseActionParams, U extends Browsable>(
  { items }: ActionArguments<T>,
): Promise<ActionFlags | ActionResult> {
  for (const item of items) {
    const action = item?.action as U;
    await systemopen(action.html_url);
  }
  return ActionFlags.None;
}
