import type {
  ItemHighlight,
} from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import { GithubBaseColumn } from "./github_base.ts";
import type { Denops } from "https://deno.land/x/denops_std@v6.5.0/mod.ts";
import { strwidth } from "https://deno.land/x/denops_std@v6.5.0/function/mod.ts";

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
