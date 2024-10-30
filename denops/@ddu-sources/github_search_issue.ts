import type { GatherArguments } from "jsr:@shougo/ddu-vim@~6.2.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@~6.2.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~6.2.0/source";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";
import { debounce } from "jsr:@std/async@~1.0.1";

type Params = {
  hostname: string;
  query: string;
};

function starter(
  { sourceParams }: GatherArguments<Params>,
  controller: ReadableStreamDefaultController,
) {
  return async function () {
    try {
      const client = await getClient();
      const q = [
        "is:issue",
        ...(sourceParams.query ? [sourceParams.query] : []),
      ].join(" ");
      const iterator = client.paginate.iterator(
        client.rest.search.issuesAndPullRequests,
        { q },
      );

      // iterate through each response
      for await (const { data: issues } of iterator) {
        controller.enqueue(
          issues.filter((issue) => !issue.pull_request).map(
            (issue) => {
              return {
                action: issue,
                word: `${issue.number} ${issue.title}`,
              };
            },
          ),
        );
      }
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
    return { hostname: "github.com", query: "" };
  }
}
