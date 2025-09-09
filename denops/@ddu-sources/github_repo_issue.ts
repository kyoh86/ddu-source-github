import type { GatherArguments } from "jsr:@shougo/ddu-vim@11.1.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@11.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@11.1.0/source";
import { getClient } from "../ddu-source-github/github/client.ts";
import { githubRepo, type RepoParams } from "../ddu-source-github/git.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import {
  ControllerClosed,
  ingestLabels,
  type IssueLikeState,
  maybeControllerClosed,
} from "../ddu-source-github/github/types.ts";

type Params = RepoParams & { state: IssueLikeState };

async function fetchItems(
  owner: string,
  name: string,
  state: IssueLikeState,
  controller: ReadableStreamDefaultController<Item<ActionData>[]>,
) {
  const client = await getClient();
  const iterator = client.paginate.iterator(
    client.rest.issues.listForRepo,
    {
      owner: owner,
      repo: name,
      per_page: 100,
      state: state,
    },
  );

  // iterate through each response
  for await (const { data: issues } of iterator) {
    try {
      controller.enqueue(
        issues.filter((issue) => !issue.pull_request).map((issue) => ({
          action: { ...issue, labels: ingestLabels(issue.labels) },
          word: `${issue.number} ${issue.title}`,
        })),
      );
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
  override kind = "github_issue";

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
          await fetchItems(
            repo.value.owner,
            repo.value.name,
            params.state,
            controller,
          );
        } catch (e) {
          console.error(e);
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
