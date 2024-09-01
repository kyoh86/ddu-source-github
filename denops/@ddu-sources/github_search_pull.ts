import type { GatherArguments } from "jsr:@shougo/ddu-vim@~6.0.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@~6.0.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~6.0.0/source";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_pull.ts";
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
        "is:pr",
        ...(sourceParams.query ? [sourceParams.query] : []),
      ].join(" ");
      const iterator = client.paginate.iterator(
        client.rest.search.issuesAndPullRequests,
        { q },
      );

      // iterate through each response
      for await (const { data: prs } of iterator) {
        controller.enqueue(
          prs.map(
            (pr) => {
              return {
                action: pr,
                word: `${pr.number} ${pr.title}`,
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
  override kind = "github_pull";

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
