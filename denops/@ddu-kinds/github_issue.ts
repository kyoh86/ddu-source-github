import {
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.4.2/types.ts";
import type {
  Actions,
  Previewer,
} from "https://deno.land/x/ddu_vim@v3.4.2/types.ts";
import type { Issue } from "../ddu-source-github/github/types.ts";
import { editContent } from "../ddu-kind-github/edit_content.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.4.2/base/kind.ts";
import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.2.0/mod.ts";

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
    edit: async ({ denops, items, actionParams }) => {
      if (items.length != 1) {
        console.error("Invalid selection: never accept multiple items");
        return ActionFlags.None;
      }
      const params = ensure(actionParams, is.Record);

      const opener = maybe(params["opener"], is.String) ?? "tabedit";
      if (!(opener in { edit: 0, split: 0, vsplit: 0, tabedit: 0 })) {
        console.error(`Invalid opener: ${opener}`);
        return ActionFlags.None;
      }

      const mods = maybe(params["mods"], is.String);
      const bang = maybe(params["bang"], is.Boolean);
      await editContent(denops, items[0].action as ActionData, opener, mods, bang);
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
        syntax: "markdown",
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
