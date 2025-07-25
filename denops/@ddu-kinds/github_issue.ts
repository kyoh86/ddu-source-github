import type { Actions } from "jsr:@shougo/ddu-vim@10.3.0/types";
import {
  BaseKind,
  type GetPreviewerArguments,
} from "jsr:@shougo/ddu-vim@10.3.0/kind";
import type { IssueLike } from "../ddu-source-github/github/types.ts";
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

export type ActionData = IssueLike;

type Params = Record<PropertyKey, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: openUrl<Params, ActionData>,
    browse: openUrl<Params, ActionData>,
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
