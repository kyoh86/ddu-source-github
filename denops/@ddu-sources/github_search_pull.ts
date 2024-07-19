import type { GatherArguments } from "https://deno.land/x/ddu_vim@v4.1.1/base/source.ts";
import {
  BaseSource,
  type Item,
} from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_pull.ts";
import { debounce } from "https://deno.land/std@0.224.0/async/mod.ts";

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
      const client = await getClient(sourceParams.hostname);
      const q = [
        "is:pr",
        ...(sourceParams.query ? [sourceParams.query] : []),
      ].join(" ");
      console.log(q);
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
