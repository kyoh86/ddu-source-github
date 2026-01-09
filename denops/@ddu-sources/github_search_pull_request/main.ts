import type { GatherArguments } from "@shougo/ddu-vim/source";
import type { Item } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";
import { getClient } from "../../ddu-source-github/github/client.ts";
import type { ActionData } from "../../@ddu-kinds/github_issue/main.ts";
import { debounce } from "@std/async";
import {
  ControllerClosed,
  ingestLabels,
  maybeControllerClosed,
} from "../../ddu-source-github/github/types.ts";

type Params = { hostname: string };

async function searchIssues(
  input: string,
  controller: ReadableStreamDefaultController<Item<ActionData>[]>,
) {
  const client = await getClient();
  const iterator = client.paginate.iterator(
    client.rest.search.issuesAndPullRequests,
    { q: input },
  );

  // iterate through each response
  for await (const { data: issues } of iterator) {
    try {
      controller.enqueue(
        issues.filter((issue) => !issue.pull_request).map(
          (issue) => ({
            action: { ...issue, labels: ingestLabels(issue.labels) },
            word: `${issue.number} ${issue.title}`,
          }),
        ),
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

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_issue";

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
