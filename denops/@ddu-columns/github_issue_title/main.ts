import type { ItemHighlight } from "@shougo/ddu-vim/types";
import type { ActionData } from "../../@ddu-kinds/github_issue/main.ts";
import { GithubBaseColumn } from "../github_base/main.ts";
import type { Denops } from "@denops/std";
import { strwidth } from "@denops/std/function";

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
