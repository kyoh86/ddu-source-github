import type { GatherArguments } from "jsr:@shougo/ddu-vim@~5.0.0/source";
import { BaseSource, type Item } from "jsr:@shougo/ddu-vim@~5.0.0/types";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";

type Params = {
  hostname: string;
  role: "created" | "assigned" | "mentioned";
  state: "open" | "closed" | "all";
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_issue";

  override gather(
    { sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const client = await getClient();
          const iterator = client.paginate.iterator(
            client.rest.issues.list,
            {
              filter: sourceParams.role,
              per_page: 100,
              state: sourceParams.state,
            },
          );

          // iterate through each response
          for await (const { data: issues } of iterator) {
            controller.enqueue(
              issues.filter((issue) => !issue.pull_request).map((issue) => {
                return {
                  action: issue,
                  word:
                    `${issue.repository?.full_name}#${issue.number} ${issue.title}`,
                };
              }),
            );
          }
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
