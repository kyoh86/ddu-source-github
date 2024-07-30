import type { ItemHighlight } from "jsr:@shougo/ddu-vim@5.0.0/types";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import { GithubBaseColumn } from "./github_base.ts";
import type { Denops } from "jsr:@denops/std@7.0.1";
import { strwidth } from "jsr:@denops/std@7.0.1/function";

export class Column extends GithubBaseColumn {
  override async getAttr(
    denops: Denops,
    { state }: ActionData,
  ): Promise<{
    rawText: string;
    highlights?: ItemHighlight[];
  }> {
    const rawText = `${state} `;
    return {
      rawText,
      highlights: [{
        col: 0,
        width: await strwidth(denops, rawText) + 1,
        hl_group: `dduColumnGithubIssueState`,
        name: `dduColumnGithubIssueState0`,
      }],
    };
  }
  override getBaseText(): string {
    return "";
  }
}
