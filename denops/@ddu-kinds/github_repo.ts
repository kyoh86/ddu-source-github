import { type Actions, BaseKind } from "jsr:@shougo/ddu-vim@5.0.0/types";
import type { Repository } from "../ddu-source-github/github/types.ts";
import { openUrl } from "../ddu-kind-github/browsable.ts";

export type ActionData = Repository;

type Params = Record<PropertyKey, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: openUrl<Params, ActionData>,
  };

  params(): Params {
    return {};
  }
}
