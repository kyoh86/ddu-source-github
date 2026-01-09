import type { GatherArguments } from "@shougo/ddu-vim/source";
import type { Item } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";
import { getClient } from "../../ddu-source-github/github/client.ts";
import type { ActionData } from "../../@ddu-kinds/github_issue/main.ts";
import {
  ControllerClosed,
  ingestLabels,
  type IssueLikeState,
  maybeControllerClosed,
} from "../../ddu-source-github/github/types.ts";

type Params = {
  hostname: string;
  role: "created" | "assigned" | "mentioned";
  state: IssueLikeState;
};

async function fetchItems(
  params: Params,
  controller: ReadableStreamDefaultController<Item<ActionData>[]>,
) {
  const client = await getClient();
  const iterator = client.paginate.iterator(
    client.rest.issues.list,
    {
      filter: params.role,
      per_page: 100,
      state: params.state,
    },
  );

  // iterate through each response
  for await (const { data: prs } of iterator) {
    try {
      controller.enqueue(
        prs.filter((pr) => pr.pull_request).map((pr) => ({
          action: { ...pr, labels: ingestLabels(pr.labels) },
          word: `${pr.repository?.full_name}#${pr.number} ${pr.title}`,
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
  override kind = "github_pull";

  override gather(
    { sourceParams: params }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          await fetchItems(params, controller);
        } finally {
          controller.close();
        }
      },
    });
  }

  override params(): Params {
    return { hostname: "github.com", role: "assigned", state: "open" };
  }
}
