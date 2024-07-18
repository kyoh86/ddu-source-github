import type { GatherArguments } from "https://deno.land/x/ddu_vim@v4.1.1/base/source.ts";
import { BaseSource, type Item } from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";
import { getClient } from "../ddu-source-github/github/client.ts";
import { githubRepo, type RepoParams } from "../ddu-source-github/git.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";

type Params = RepoParams & {
  state: "open" | "closed" | "all";
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_issue";

  override gather(
    { denops, sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const repo = await githubRepo(denops, sourceParams);
          if (repo === undefined) {
            console.error(
              `invalid param: ${JSON.stringify(sourceParams)}`,
            );
            return;
          }
          const client = await getClient(repo.hostname);
          const iterator = client.paginate.iterator(
            client.rest.issues.listForRepo,
            {
              owner: repo.owner,
              repo: repo.name,
              per_page: 100,
              state: sourceParams.state,
            },
          );

          // iterate through each response
          for await (const { data: issues } of iterator) {
            controller.enqueue(
              issues.filter((issue) => !issue.pull_request).map((issue) => {
                return {
                  action: issue,
                  word: `${issue.number} ${issue.title}`,
                };
              }),
            );
          }
        } finally {
          controller.close();
        }
      },
    });
  }

  override params(): Params {
    return { source: "cwd", remoteName: "origin", state: "open" };
  }
}
