import type { GatherArguments } from "@shougo/ddu-vim/source";
import type { Item } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";
import { debounce } from "@std/async";
import { getClient } from "../ddu-source-github/github/client.ts";
import type { ActionData } from "../@ddu-kinds/github_repo.ts";
import {
  ControllerClosed,
  maybeControllerClosed,
} from "../ddu-source-github/github/types.ts";

type Params = { hostname: string };

async function searchRepos(
  input: string,
  controller: ReadableStreamDefaultController,
) {
  try {
    const client = await getClient();
    const iterator = client.paginate.iterator(client.rest.search.repos, {
      q: input,
    });

    // iterate through each response
    for await (const { data: repos } of iterator) {
      try {
        const chunk = repos.map((repo) => {
          return {
            action: repo,
            word: `${repo.full_name}`,
          };
        });
        controller.enqueue(chunk);
      } catch (e) {
        if (maybeControllerClosed(e)) {
          console.debug(ControllerClosed);
        } else {
          console.warn(e);
        }
        break;
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    controller.close();
  }
}

const starter = debounce(searchRepos, 1000);

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_repo";

  override gather(
    { input }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      start(controller) {
        starter(input, controller);
      },
    });
  }

  override params(): Params {
    return { hostname: "github.com" };
  }
}
