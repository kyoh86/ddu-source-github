import type { GatherArguments } from "https://deno.land/x/ddu_vim@v4.1.1/base/source.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";
import { getClient } from "../ddu-source-github/github/client.ts";
import { ActionData } from "../@ddu-kinds/github_issue.ts";
import { debounce } from "https://deno.land/std@0.224.0/async/mod.ts";
import { githubRepo, type RepoParams } from "../ddu-source-github/git.ts";

type Params = RepoParams & {
  query: string;
};

function starter(
  { denops, sourceParams }: GatherArguments<Params>,
  controller: ReadableStreamDefaultController,
) {
  return async function () {
    try {
      const repo = await githubRepo(denops, sourceParams);
      const client = await getClient(repo?.hostname ?? "github.com");
      const q = [
        "is:issue",
        ...(repo ? [`repo:${repo.owner}/${repo.name}`] : []),
        ...(sourceParams.query ? [sourceParams.query] : []),
      ].join(" ");
      const iterator = client.paginate.iterator(
        client.rest.search.issuesAndPullRequests,
        { q },
      );

      // iterate through each response
      for await (const { data: issues } of iterator) {
        controller.enqueue(
          issues.filter((issue) => !issue.pull_request).map(
            (issue) => {
              return {
                action: issue,
                word: `${issue.number} ${issue.title}`,
              };
            },
          ),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      controller.close();
    }
  };
}

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_issue";

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      start(controller) {
        const f = debounce(starter(args, controller), 1000);
        f();
      },
    });
  }

  override params(): Params {
    return { source: "cwd", remoteName: "origin", query: "" };
  }
}
