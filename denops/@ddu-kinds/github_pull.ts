import { BaseKind } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import type { Actions } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import type { PullRequest } from "../ddu-source-github/github/types.ts";
import {
  editContent,
  getPreviewer,
  openUrl,
} from "../ddu-kind-github/issue_like.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/kind.ts";

export type ActionData = PullRequest;

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: openUrl<Params, PullRequest>,
    edit: editContent<Params, PullRequest>,
  };

  override getPreviewer(args: GetPreviewerArguments) {
    return getPreviewer(args);
  }

  params(): Params {
    return {};
  }
}
