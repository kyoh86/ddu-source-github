import { BaseKind } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import type { Actions } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import type { Issue } from "../ddu-source-github/github/types.ts";
import { editContent, getPreviewer } from "../ddu-kind-github/issue_like.ts";
import { openUrl } from "../ddu-kind-github/browsable.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/kind.ts";

export type ActionData = Issue;

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: openUrl<Params, ActionData>,
    edit: editContent<Params, ActionData>,
  };

  override getPreviewer(args: GetPreviewerArguments) {
    return getPreviewer(args);
  }

  params(): Params {
    return {};
  }
}
