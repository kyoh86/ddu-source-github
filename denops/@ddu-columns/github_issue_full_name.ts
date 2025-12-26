import type { ItemHighlight } from "@shougo/ddu-vim/types";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import { GithubBaseColumn } from "./github_base.ts";
import type { Denops } from "@denops/std";
import { strwidth } from "@denops/std/function";

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
