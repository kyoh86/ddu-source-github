import type { GatherArguments } from "https://deno.land/x/ddu_vim@v4.0.0/base/source.ts";
import { getcwd } from "https://deno.land/x/denops_std@v6.4.0/function/mod.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v4.0.0/types.ts";
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

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_pull";

  override gather(
    { denops, sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          let cwd: string | undefined;
          let repo:
            | { hostname: string; owner: string; name: string }
            | undefined;
          switch (sourceParams.source) {
            case "cwd": {
              cwd = sourceParams.path ?? await getcwd(denops);
              const dir = await gitdir(cwd);
              if (dir === undefined) {
                break;
              }
              repo = await parseGitHubRepo(dir.gitdir, sourceParams.remoteName);
              break;
            }
            case "repo": {
              repo = sourceParams;
              break;
            }
          }
          if (repo === undefined) {
            console.error(`invalid param: ${JSON.stringify(sourceParams)}`);
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
                action: {
                  ...pull,
                  cwd,
                },
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
