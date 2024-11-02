import type { Actions } from "jsr:@shougo/ddu-vim@~6.4.0/types";
import { BaseKind } from "jsr:@shougo/ddu-vim@~6.4.0/kind";
import type { Repository } from "../ddu-source-github/github/types.ts";
import { openUrl } from "../ddu-kind-github/browsable.ts";

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
