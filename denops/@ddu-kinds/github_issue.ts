import {
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.4.2/types.ts";
import type {
  Actions,
  Previewer,
} from "https://deno.land/x/ddu_vim@v3.4.2/types.ts";
import type { Issue } from "../ddu-source-github/github/types.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.4.2/base/kind.ts";

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
  override getPreviewer(
    { item }: GetPreviewerArguments,
  ): Promise<Previewer | undefined> {
    const action = item.action as ActionData;
    if (action.body) {
      return Promise.resolve({
        kind: "nofile",
        contents: action.body.split(/\r?\n/),
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
