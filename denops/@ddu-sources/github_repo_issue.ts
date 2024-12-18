import type { GatherArguments } from "jsr:@shougo/ddu-vim@~9.1.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@~9.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~9.1.0/source";
import { is, maybe } from "jsr:@core/unknownutil@4.3";
import { getClient } from "../ddu-source-github/github/client.ts";
import { githubRepo, type RepoParams } from "../ddu-source-github/git.ts";
import type { ActionData } from "../@ddu-kinds/github_issue.ts";

type State = "open" | "closed" | "all";
type Params = RepoParams & { state: State };

type RawLabel = string | {
  name?: string;
};

function convertLabels(labels: RawLabel[]) {
  return labels.map((
    l,
  ) => (typeof l == "string"
    ? { name: l ?? "" }
    : { ...l, name: l.name ?? "" })
  );
}

const ControllerClosed =
  "The stream controller cannot close or enqueue" as const;

function maybeControlleClosed(e: unknown) {
  const err = maybe(e, is.ObjectOf({ message: is.String }));
  if (err && err.message === ControllerClosed) {
    return ControllerClosed;
  }
  return undefined;
}

async function fetchItems(
  owner: string,
  name: string,
  state: State,
  controller: ReadableStreamDefaultController<Item<ActionData>[]>,
) {
  const client = await getClient();
  const iterator = client.paginate.iterator(
    client.rest.issues.listForRepo,
    {
      owner: owner,
      repo: name,
      per_page: 100,
      state: state,
    },
  );

  // iterate through each response
  for await (const { data: issues } of iterator) {
    try {
      controller.enqueue(
        issues.filter((issue) => !issue.pull_request).map((issue) => ({
          action: { ...issue, labels: convertLabels(issue.labels) },
          word: `${issue.number} ${issue.title}`,
        })),
      );
    } catch (e) {
      if (maybeControlleClosed(e)) {
        console.debug(ControllerClosed);
      } else {
        console.warn(e);
      }
      break;
    }
  }
}

export class Source extends BaseSource<Params, ActionData> {
  override kind = "github_issue";

  override gather(
    { denops, sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const repo = await githubRepo(denops, sourceParams);
          if (repo === undefined) {
            console.error(`invalid param: ${JSON.stringify(sourceParams)}`);
            return;
          }
          await fetchItems(
            repo.owner,
            repo.name,
            sourceParams.state,
            controller,
          );
        } catch (e) {
          console.error(e);
        } finally {
          controller.close();
        }
      },
    });
  }

  override params(): Params {
    return { source: "cwd", remoteName: "origin", state: "open" };
  }
}
