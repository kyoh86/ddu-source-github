import type { GatherArguments } from "https://deno.land/x/ddu_vim@v3.4.2/base/source.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.4.2/types.ts";
import { getClient } from "../ddu-source-github/github/client.ts";
import { ActionData } from "../@ddu-kinds/github_issue.ts";

type Params = {
  hostname: string;
  role: "created" | "assigned" | "mentioned";
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_issue";

  override gather(
    { sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const client = await getClient(sourceParams.hostname);
          const iterator = client.paginate.iterator(
            client.rest.issues.list,
            {
              filter: sourceParams.role,
              per_page: 100,
            },
          );

          // iterate through each response
          for await (const { data: issues } of iterator) {
            controller.enqueue(issues.map((issue) => {
              return {
                action: issue,
                word: `${issue.number} ${issue.title}`,
              };
            }));
          }
        } finally {
          controller.close();
        }
      },
    });
  }

  override params(): Params {
    return { hostname: "github.com", role: "assigned" };
  }
}
