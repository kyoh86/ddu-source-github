import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import type { GatherArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/source.ts";
import { getcwd } from "https://deno.land/x/denops_std@v5.0.1/function/mod.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import { getClient } from "../ddu-source-github/github/client.ts";
import { gitdir, parseGitHubRepo } from "../ddu-source-github/git.ts";
import { ActionData } from "../@ddu-kinds/github_pull.ts";

type Params = {
  source: "cwd";
  remoteName: string;
  path?: string;
} | {
  source: "repo";
  hostname: string;
  owner: string;
  name: string;
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
  override kind = "github_pull";

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
            client.rest.pulls.list,
            {
              owner: repo.owner,
              repo: repo.name,
              per_page: 100,
            },
          );

          // iterate through each response
          for await (const { data: pulls } of iterator) {
            const chunk = pulls.map((pull) => {
              return {
                action: pull,
                word: `${pull.number} ${pull.title}`,
              };
            });
            controller.enqueue(chunk);
          }
        } finally {
          controller.close();
        }
      },
    });
  }

  override params(): Params {
    return { source: "cwd", remoteName: "origin" };
  }
}