import { BaseKind } from "https://deno.land/x/ddu_vim@v3.9.0/types.ts";
import type { Actions } from "https://deno.land/x/ddu_vim@v3.9.0/types.ts";
import type { Issue } from "../ddu-source-github/github/types.ts";
import {
  append,
  appendNumber,
  appendTitle,
  appendUrl,
  editContent,
  getPreviewer,
  insert,
  insertNumber,
  insertTitle,
  insertUrl,
  yank,
  yankNumber,
  yankTitle,
  yankUrl,
} from "../ddu-kind-github/issue_like.ts";
import { openUrl } from "../ddu-kind-github/browsable.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v3.9.0/base/kind.ts";

export type ActionData = Issue;

type Params = Record<PropertyKey, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: openUrl<Params, ActionData>,
    edit: editContent<Params>,
    yank: yank<Params>,
    yankNumber: yankNumber<Params>,
    yankUrl: yankUrl<Params>,
    yankTitle: yankTitle<Params>,
    append: append<Params>,
    appendNumber: appendNumber<Params>,
    appendUrl: appendUrl<Params>,
    appendTitle: appendTitle<Params>,
    insert: insert<Params>,
    insertNumber: insertNumber<Params>,
    insertUrl: insertUrl<Params>,
    insertTitle: insertTitle<Params>,
  };

  override getPreviewer(args: GetPreviewerArguments) {
    return getPreviewer(args);
  }

  params(): Params {
    return {};
  }
}
