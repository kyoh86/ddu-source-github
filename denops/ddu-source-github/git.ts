import { dirname, join } from "@std/path";
import { getcwd } from "@denops/std/function";
import type { Denops } from "@denops/std";
import { parse } from "@std/ini";
import { is, maybe } from "@core/unknownutil";

import { failure, type Result, success } from "./result.ts";

export type RepoParams = {
  source: "cwd";
  remoteName: string;
  path?: string;
} | {
  source: "repo";
  hostname: string;
  owner: string;
  name: string;
};

export type RepoProfile =
  | { hostname: string; owner: string; name: string; cwd: string }
  | { hostname: string; owner: string; name: string };

export async function githubRepo(
  denops: Denops,
  params: RepoParams,
): Promise<Result<RepoProfile, unknown>> {
  switch (params.source) {
    case "cwd": {
      const cwd = params.path ?? await getcwd(denops);
      const dir = await gitdir(cwd);
      if (dir === undefined) {
        return failure("it's not a git directory");
      }
      const repo = await parseGitHubRepo(dir.gitdir, params.remoteName);
      if (repo === undefined) {
        return failure("failed to find a URL for the GitHub repository");
      }
      return success({ cwd, hostname: repo[0], owner: repo[1], name: repo[2] });
    }
    case "repo":
      return success({
        hostname: params.hostname,
        owner: params.owner,
        name: params.name,
      });
  }
}

async function pathType(path: string) {
  try {
    const stat = await Deno.stat(path);
    if (stat.isDirectory) {
      return "directory";
    }
    if (stat.isFile) {
      return "file";
    }
  } catch {
    // noop
  }
  return "unknown";
}

export async function gitdir(path: string) {
  const start = path;
  while (true) {
    const candidate = join(path, ".git");
    switch (await pathType(candidate)) {
      case "directory":
        return {
          path,
          gitdir: candidate,
          prefix: start.substring(path.length + 1),
        };
      case "file": {
        const text = (await Deno.readTextFile(candidate)).trim();
        const m = /^gitdir:\s*(.*)$/.exec(text);
        return m
          ? {
            path,
            gitdir: m[1]!,
            prefix: start.substring(path.length + 1),
          }
          : undefined;
      }
    }
    const next = dirname(path);
    if (next === path) {
      return;
    }
    path = next;
  }
}

export async function parseHeadCommit(gitdir: string) {
  const reftext = (await Deno.readTextFile(join(gitdir, "HEAD"))).trim();
  const refmatch = /^ref:\s*(refs\/[^\/]+\/[^\/]+)$/.exec(reftext);
  if (!refmatch) {
    return;
  }
  const comtext = (await Deno.readTextFile(`${gitdir}/${refmatch[1]}`)).trim();
  if (!comtext) {
    return;
  }
  return comtext[1];
}

export async function parseHeadRef(gitdir: string) {
  const reftext = (await Deno.readTextFile(join(gitdir, "HEAD"))).trim();
  const refmatch = /^ref:\s*refs\/([^\/]+\/[^\/]+)$/.exec(reftext);
  if (!refmatch) {
    return;
  }
  return refmatch[1];
}

export async function parseConfig(gitdir: string) {
  const conftext = await Deno.readTextFile(join(gitdir, "config"));
  const config = parse(conftext) as Record<string, Record<string, unknown>>;
  const keys = Object.keys(config);
  for (const key of keys) {
    const m = /(\w+) "([^"]+)"/.exec(key);
    if (!m || !m[1] || !m[2]) {
      continue;
    }
    Object.assign(config, {
      [m[1]]: Object.assign(config[m[1]] || {}, { [m[2]]: config[key] }),
    });
    delete config[key];
  }
  // UNDONE: support [include] and [includeIf ""]
  return config;
}

export function parseGitHubURLLike(urlLike?: string) {
  if (!urlLike) {
    return;
  }
  if (/^https:/.test(urlLike) && URL.canParse(urlLike)) {
    const url = new URL(urlLike);
    const [_, ...parts] = url.pathname.replace(/\.git$/, "").split("/");
    return [url.hostname, ...parts];
  }
  if (/^git@/.test(urlLike)) {
    return urlLike.replaceAll(/^git@|\.git$/g, "").split(/[\/:]/);
  }
  if (/^ssh:\/\//.test(urlLike)) {
    return urlLike.replaceAll(/^ssh:\/\/(git@)?|\.git$/g, "").split("/");
  }
  return;
}

export async function parseGitHubRepo(gitdir: string, remote: string) {
  const conf = await parseConfig(gitdir);
  return parseGitHubURLLike(
    (conf["remote"]?.[remote] as { url?: string } | undefined)?.url,
  );
}

export async function findRemoteByRepo(
  gitdir: string,
  repo: {
    hostname: string;
    owner: string;
    name: string;
  },
) {
  const { remote } = await parseConfig(gitdir);
  for (const name in remote) {
    const value = maybe(remote[name], is.Record);
    if (!value) {
      continue;
    }
    const url = maybe(value["url"], is.String);
    if (!url) {
      continue;
    }
    const cand = parseGitHubURLLike(url);
    if (
      cand &&
      repo.hostname === cand[0] &&
      repo.owner == cand[1] &&
      repo.name && cand[2]
    ) {
      return name;
    }
  }
  return;
}
