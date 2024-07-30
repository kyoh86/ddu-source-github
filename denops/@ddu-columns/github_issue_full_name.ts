import type { ItemHighlight } from "jsr:@shougo/ddu-vim@5.0.0/types";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import { GithubBaseColumn } from "./github_base.ts";
import type { Denops } from "jsr:@denops/std@7.0.1";
import { strwidth } from "jsr:@denops/std@7.0.1/function";

export class Column extends GithubBaseColumn {
  override async getAttr(
    denops: Denops,
    { repository, number }: ActionData,
  ): Promise<{
    rawText: string;
    highlights?: ItemHighlight[];
  }> {
    const rawText = `${repository?.full_name}#${number} `;
    return {
      rawText,
      highlights: [{
        col: 0,
        width: await strwidth(denops, rawText) + 1,
        hl_group: `dduColumnGithubIssueFullName`,
        name: `dduColumnGithubIssueFullName0`,
      }],
    };
  }
  override getBaseText(): string {
    return "foobar/bazbaax#12345";
  }
}
