import type { GatherArguments } from "@shougo/ddu-vim/source";
import type { Item } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";
import { getClient } from "../../ddu-source-github/github/client.ts";
import { githubRepo, type RepoParams } from "../../ddu-source-github/git.ts";
import type { ActionData } from "../../@ddu-kinds/github_pull/main.ts";
import {
  ControllerClosed,
  type IssueLikeState,
  maybeControllerClosed,
} from "../../ddu-source-github/github/types.ts";

type Params = RepoParams & {
  state: IssueLikeState;
};

async function fetchPulls(
  owner: string,
  name: string,
  cwd: { cwd?: string },
  state: IssueLikeState,
  controller: ReadableStreamDefaultController<Item<ActionData>[]>,
) {
  const client = await getClient();
  const iterator = client.paginate.iterator(
    client.rest.pulls.list,
    {
      owner: owner,
      repo: name,
      per_page: 100,
      state: state,
    },
  );

  // iterate through each response
  for await (const { data: pulls } of iterator) {
    try {
      controller.enqueue(pulls.map((pull) => ({
        action: { ...pull, ...cwd },
        word: `${pull.number} ${pull.title}`,
      })));
    } catch (e) {
      if (maybeControllerClosed(e)) {
        console.debug(ControllerClosed);
      } else {
        console.warn(e);
      }
      break;
    }
  }
}

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_pull";

  override gather(
    { denops, sourceParams: params }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const repo = await githubRepo(denops, params);
          if (!repo.ok) {
            console.error(`${repo.error}: ${JSON.stringify(params)}`);
            return;
          }
          await fetchPulls(
            repo.value.owner,
            repo.value.name,
            ("cwd" in repo.value) ? { cwd: repo.value.cwd } : {},
            params.state,
            controller,
          );
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
