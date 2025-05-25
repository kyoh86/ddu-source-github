import type { GatherArguments } from "jsr:@shougo/ddu-vim@10.3.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@10.3.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@10.3.0/source";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts"; // NOTE: Search results forms like issue
import { debounce } from "jsr:@std/async@1.0.13";
import {
  ControllerClosed,
  ingestLabels,
  maybeControllerClosed,
} from "../ddu-source-github/github/types.ts";

type Params = { hostname: string };

async function searchPullRequests(
  input: string,
  controller: ReadableStreamDefaultController<Item<ActionData>[]>,
) {
  const client = await getClient();
  const iterator = client.paginate.iterator(
    client.rest.search.issuesAndPullRequests,
    { q: `is:pull-request ${input}` },
  );

  // iterate through each response
  for await (const { data: prs } of iterator) {
    try {
      controller.enqueue(
        prs.filter((pr) => !pr.pull_request).map((pr) => ({
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

function starter(
  { input }: GatherArguments<Params>,
  controller: ReadableStreamDefaultController,
) {
  return async function () {
    try {
      await searchPullRequests(input, controller);
    } catch (e) {
      console.error(e);
    } finally {
      controller.close();
    }
  };
}

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_issue"; // NOTE: Search results forms like issue

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
    return { hostname: "github.com" };
  }
}
