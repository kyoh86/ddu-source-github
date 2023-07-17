import {
  ActionFlags,
  Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.4.2/types.ts";
import { Issue } from "../ddu-source-github/github/types.ts";

export type ActionData = Issue;

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: async (args) => {
      for (const item of args.items) {
        const action = item?.action as ActionData;
        await args.denops.call("ddu#kind#file#open", action.html_url);
      }
      return ActionFlags.None;
    },
  };
  params(): Params {
    return {};
  }
}
