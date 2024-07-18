import type { Denops } from "https://deno.land/x/denops_std@v6.5.1/mod.ts";
import type { GatherArguments } from "https://deno.land/x/ddu_vim@v4.2.0/base/source.ts";
import { getcwd } from "https://deno.land/x/denops_std@v6.5.1/function/mod.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v4.2.0/types.ts";
import { getClient } from "../ddu-source-github/github/client.ts";
import { gitdir, parseGitHubRepo } from "../ddu-source-github/git.ts";
import { ActionData } from "../@ddu-kinds/github_issue.ts";

type Params =
  & ({
    source: "cwd";
    remoteName: string;
    path?: string;
  } | {
    source: "repo";
    hostname: string;
    owner: string;
    name: string;
  })
  & {
    state: "open" | "closed" | "all";
  };

async function githubRepo(denops: Denops, params: Params) {
  switch (params.source) {
    case "cwd": {
      const path = params.path ?? await getcwd(denops);
      const dir = await gitdir(path);
      if (dir === undefined) {
        return;
      }
      return await parseGitHubRepo(dir?.gitdir, params.remoteName);
    }
    case "repo":
      return {
        hostname: params.hostname,
        owner: params.owner,
        name: params.name,
      };
  }
}

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
