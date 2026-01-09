import type { Actions } from "@shougo/ddu-vim/types";
import { BaseKind } from "@shougo/ddu-vim/kind";
import type { Repository } from "../../ddu-source-github/github/types.ts";
import { openUrl } from "../../ddu-kind-github/browsable.ts";

export type ActionData = Repository;

type Params = Record<PropertyKey, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: openUrl<Params, ActionData>,
    browse: openUrl<Params, ActionData>,
  };

  params(): Params {
    return {};
  }
}
