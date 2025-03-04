import {
  type Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";
import type { Thread } from "../ddu-source-github/github/types.ts";
import { openUrl } from "../ddu-kind-github/browsable.ts";

export type ActionData = Thread & {
  html_url: string;
};

type Params = Record<PropertyKey, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: openUrl<Params, ActionData>,
  };

  params(): Params {
    return {};
  }
}
