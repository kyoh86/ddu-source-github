import type { GatherArguments } from "jsr:@shougo/ddu-vim@10.3.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@10.3.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@10.3.0/source";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import {
  ControllerClosed,
  ingestLabels,
  type IssueLikeState,
  maybeControllerClosed,
} from "../ddu-source-github/github/types.ts";

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
  for await (const { data: issues } of iterator) {
    try {
      controller.enqueue(
        issues.filter((issue) => !issue.pull_request).map((issue) => ({
          action: { ...issue, labels: ingestLabels(issue.labels) },
          word: `${issue.repository?.full_name}#${issue.number} ${issue.title}`,
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
