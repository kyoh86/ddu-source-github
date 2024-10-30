import type { ItemHighlight } from "jsr:@shougo/ddu-vim@~6.2.0/types";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import { GithubBaseColumn } from "./github_base.ts";
import type { Denops } from "jsr:@denops/std@~7.3.0";
import { strwidth } from "jsr:@denops/std@~7.3.0/function";

export class Column extends GithubBaseColumn {
  override async getAttr(
    denops: Denops,
    { title }: ActionData,
  ): Promise<{
    rawText: string;
    highlights?: ItemHighlight[];
  }> {
    const rawText = `${title} `;
    return {
      rawText,
      highlights: [{
        col: 0,
        width: await strwidth(denops, rawText) + 1,
        hl_group: `dduColumnGithubIssueTitle`,
        name: `dduColumnGithubIssueTitle0`,
      }],
    };
  }
  override getBaseText(): string {
    return "";
  }
}
