import {
  type Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v4.2.0/types.ts";
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
