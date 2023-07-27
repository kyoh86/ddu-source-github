import type { GatherArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/source.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import { getClient } from "../ddu-source-github/github/client.ts";
import { ActionData } from "../@ddu-kinds/github_repo.ts";

type Params = {
  hostname: string;
  query: string;
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_repo";

  override gather(
    { sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const client = await getClient(sourceParams.hostname);
          const iterator = client.paginate.iterator(
            client.rest.search.repos,
            {
              q: sourceParams.query,
            },
          );

          // iterate through each response
          for await (const { data: repos } of iterator) {
            const chunk = repos.map((repo) => {
              return {
                action: repo,
                word: `${repo.full_name}`,
              };
            });
            controller.enqueue(chunk);
          }
        } finally {
          controller.close();
        }
      },
    });
  }

  override params(): Params {
    return { hostname: "github.com", query: "" };
  }
}
