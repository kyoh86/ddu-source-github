import {
  type ActionArguments,
  ActionFlags,
  type Actions,
} from "jsr:@shougo/ddu-vim@~6.4.0/types";
import { BaseKind } from "jsr:@shougo/ddu-vim@~6.4.0/kind";
import type { PullRequest } from "../ddu-source-github/github/types.ts";
import { TextLineStream } from "jsr:@std/streams@~1.0.0";
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
import type { Denops } from "jsr:@denops/std@~7.3.0";
import { getcwd } from "jsr:@denops/std@~7.3.0/function";
import {
  echoallCommand,
  echoerrCommand,
} from "jsr:@kyoh86/denops-util@~0.1.0/command";

import {
  findRemoteByRepo,
  gitdir,
  parseGitHubURLLike,
} from "../ddu-source-github/git.ts";
import type { GetPreviewerArguments } from "jsr:@shougo/ddu-vim@~6.4.0/kind";

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
      console.info(`create remote ${repo.owner} for ${repo.hostname}`);
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

  console.info(`chekcout from ${remoteName}`);

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
    browse: openUrl<Params, ActionData>,
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
