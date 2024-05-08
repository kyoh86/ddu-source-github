import {
  ActionArguments,
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v4.0.0/types.ts";
import type { Actions } from "https://deno.land/x/ddu_vim@v4.0.0/types.ts";
import type { PullRequest } from "../ddu-source-github/github/types.ts";
import { TextLineStream } from "https://deno.land/std@0.224.0/streams/text_line_stream.ts";
import {
  append,
  appendNumber,
  appendTitle,
  appendUrl,
  editContent,
  ensureOnlyOneItem,
  getPreviewer,
  insert,
  insertNumber,
  insertTitle,
  insertUrl,
  yank,
  yankNumber,
  yankTitle,
  yankUrl,
} from "../ddu-kind-github/issue_like.ts";
import { openUrl } from "../ddu-kind-github/browsable.ts";
import type { Denops } from "https://deno.land/x/denops_std@v6.4.2/mod.ts";
import { getcwd } from "https://deno.land/x/denops_std@v6.4.2/function/mod.ts";
import {
  echoallCommand,
  echoerrCommand,
} from "https://denopkg.com/kyoh86/denops-util@master/command.ts";

import {
  findRemoteByRepo,
  gitdir,
  parseGitHubURLLike,
} from "../ddu-source-github/git.ts";
import type { GetPreviewerArguments } from "https://deno.land/x/ddu_vim@v4.0.0/base/kind.ts";

export type ActionData = PullRequest & {
  cwd?: string;
};

type Params = Record<PropertyKey, never>;

async function findBranch(
  denops: Denops,
  cwd: string,
  localBranch: string,
  remoteBranch: string,
) {
  const { wait, pipeOut, finalize } = echoerrCommand(denops, "git", {
    args: [
      "for-each-ref",
      "--omit-empty",
      "--format",
      [
        /* */ `%(if:equals=refs/heads/${localBranch})%(refname)%(then)`,
        /*   */ "%(upstream)",
        /* */ "%(end)",
      ].join(""),
    ],
    cwd,
  });

  try {
    for await (
      const remote of pipeOut
        .pipeThrough(new TextLineStream())
        .values()
    ) {
      if (remote == `refs/remotes/${remoteBranch}`) {
        return "tracking";
      }
      return "conflict";
    }
    return "none";
  } finally {
    await wait;
    await finalize();
  }
}

async function checkout(args: ActionArguments<Params>) {
  const item = await ensureOnlyOneItem(args.denops, args.items);
  if (!item) {
    return ActionFlags.None;
  }
  const pr = item.action as ActionData;
  const cwd = pr.cwd ?? await getcwd(args.denops);
  const dir = await gitdir(cwd);
  if (!dir) {
    console.error("not a git repository (or any of the parent directories)");
    return ActionFlags.None;
  }
  const url = (pr.head.repo || pr.base.repo).html_url;
  const repo = parseGitHubURLLike(url);
  if (!repo) {
    console.error(`invalid URL: ${url}`);
    return ActionFlags.None;
  }

  checkoutCore(args.denops, cwd, dir.gitdir, repo, url, pr);
  return ActionFlags.None;
}

async function checkoutCore(
  denops: Denops,
  cwd: string,
  gitdir: string,
  repo: { hostname: string; owner: string; name: string },
  url: string,
  pr: ActionData,
) {
  const remoteName = await findRemoteByRepo(gitdir, repo) ||
    await (async () => {
      console.log(`create remote ${repo.owner} for ${repo.hostname}`);
      await echoallCommand(denops, "git", {
        args: ["remote", "add", "--fetch", repo.owner, url],
        cwd,
      });
      await echoallCommand(denops, "git", {
        args: ["fetch", repo.owner, pr.head.ref],
        cwd,
      });
      return repo.owner;
    })();

  console.log(`chekcout from ${remoteName}`);

  const localBranch = pr.head.ref;
  const remoteBranch = `${remoteName}/${localBranch}`;
  const existance = await findBranch(
    denops,
    cwd,
    localBranch,
    remoteBranch,
  );
  switch (existance) {
    case "tracking":
      await echoallCommand(denops, "git", {
        args: ["switch", localBranch],
        cwd,
      });
      break;
    case "conflict":
      await echoallCommand(denops, "git", {
        args: ["switch", "-c", `${repo.owner}/${localBranch}`, remoteBranch],
        cwd,
      });
      break;
    case "none":
      await echoallCommand(denops, "git", {
        args: ["switch", "-c", localBranch, remoteBranch],
        cwd,
      });
      break;
  }
}

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    open: openUrl<Params, ActionData>,
    edit: editContent<Params>,
    checkout,
    yank: yank<Params>,
    yankNumber: yankNumber<Params>,
    yankUrl: yankUrl<Params>,
    yankTitle: yankTitle<Params>,
    append: append<Params>,
    appendNumber: appendNumber<Params>,
    appendUrl: appendUrl<Params>,
    appendTitle: appendTitle<Params>,
    insert: insert<Params>,
    insertNumber: insertNumber<Params>,
    insertUrl: insertUrl<Params>,
    insertTitle: insertTitle<Params>,
  };

  override getPreviewer(args: GetPreviewerArguments) {
    return getPreviewer(args);
  }

  params(): Params {
    return {};
  }
}
