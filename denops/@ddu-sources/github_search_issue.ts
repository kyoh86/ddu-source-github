import type { GatherArguments } from "jsr:@shougo/ddu-vim@~10.2.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@~10.2.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~10.2.0/source";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import { debounce } from "jsr:@std/async@~1.0.1";
import {
  ControllerClosed,
  ingestLabels,
  maybeControllerClosed,
} from "../ddu-source-github/github/types.ts";

type Params = { hostname: string };

async function searchIssues(
  input: string,
  controller: ReadableStreamDefaultController<Item<ActionData>[]>,
) {
  const client = await getClient();
  const iterator = client.paginate.iterator(
    client.rest.search.issuesAndPullRequests,
    { q: `is:issue ${input}` },
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

function starter(
  { input }: GatherArguments<Params>,
  controller: ReadableStreamDefaultController,
) {
  return async function () {
    try {
      await searchIssues(input, controller);
    } catch (e) {
      console.error(e);
    } finally {
      controller.close();
    }
  };
}

const start = debounce(starter, 1000);
export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_issue";

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      start(controller) {
        start(args, controller);
      },
    });
  }

  override params(): Params {
    return { hostname: "github.com" };
  }
}
