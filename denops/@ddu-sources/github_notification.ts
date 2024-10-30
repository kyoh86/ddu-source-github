import type { GatherArguments } from "https://deno.land/x/ddu_vim@v4.1.1/base/source.ts";
import {
  BaseSource,
  type Item,
} from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_notification.ts";

type Params = {
  hostname: string;
  all: boolean;
  participating: boolean;
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_notification";

  override gather(
    { sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const client = await getClient(sourceParams.hostname);
          const iterator = client.paginate.iterator(
            client.rest.activity.listNotificationsForAuthenticatedUser,
            {
              all: sourceParams.all,
              participating: sourceParams.participating,
              per_page: 100,
            },
          );

          // iterate through each response
          for await (const { data: notifications } of iterator) {
            controller.enqueue(
              notifications.map((notif) => {
                return {
                  action: { ...notif, html_url: notif.url },
                  word: `${notif.repository?.full_name}: ${notif.subject}`,
                };
              }),
            );
          }
        } catch (e) {
          console.error(e);
        } finally {
          controller.close();
        }
      },
    });
  }

  override params(): Params {
    return { hostname: "github.com", all: false, participating: false };
  }
}
