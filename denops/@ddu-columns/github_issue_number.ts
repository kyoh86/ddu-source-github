import type { ItemHighlight } from "jsr:@shougo/ddu-vim@~10.0.0/types";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import { GithubBaseColumn } from "./github_base.ts";
import type { Denops } from "jsr:@denops/std@~7.4.0";
import { strwidth } from "jsr:@denops/std@~7.4.0/function";

export class Column extends GithubBaseColumn {
  override async getAttr(
    denops: Denops,
    { number }: ActionData,
  ): Promise<{
    rawText: string;
    highlights?: ItemHighlight[];
  }> {
    const rawText = `${number} `;
    return {
      rawText,
      highlights: [{
        col: 0,
        width: await strwidth(denops, rawText) + 1,
        hl_group: `dduColumnGithubIssueNumber`,
        name: `dduColumnGithubIssueNumber0`,
      }],
    };
  }
  override getBaseText(): string {
    return "12345";
  }
}
