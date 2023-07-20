import { dirname, join } from "https://deno.land/std@0.194.0/path/mod.ts";
import { decode } from "https://deno.land/x/ini@v2.1.0/mod.ts";

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
  const config = decode(conftext) as Record<string, Record<string, unknown>>;
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

function parseRepoPathname(path: string) {
  const [prefix, owner, name, ...rest] = path.replace(/\.git$/, "").split("/");
  if (prefix != "" || rest.length > 0) {
    return;
  }
  return {
    owner,
    name,
  };
}

export function parseGitHubURLLike(urlLike?: string) {
  if (!urlLike) {
    return;
  }
  if (/^https:/.test(urlLike)) {
    if (!URL.canParse(urlLike)) return;
    const url = new URL(urlLike);
    const repoName = parseRepoPathname(url.pathname);
    return repoName
      ? {
        hostname: url.hostname,
        ...repoName,
      }
      : undefined;
  }
  if (/^git@/.test(urlLike)) {
    const [hostname, owner, name, ...rest] = urlLike
      .replaceAll(/^git@|\.git$/g, "")
      .split(/[\/:]/);
    return rest.length > 0 ? undefined : {
      hostname,
      owner,
      name,
    };
  }
  if (/^ssh:\/\//.test(urlLike)) {
    const [hostname, owner, name, ...rest] = urlLike.replaceAll(
      /^ssh:\/\/(git@)?|\.git$/g,
      "",
    )
      .split("/");
    return rest.length > 0 ? undefined : {
      hostname,
      owner,
      name,
    };
  }
}

export async function parseGitHubRepo(gitdir: string, remote: string) {
  const config = await parseConfig(gitdir);
  // UNDONE: support other remotes (other of "origin")
  // UNDONE: support GitHub enterprise
  // UNDONE: more safety
  const remotes = config["remote"];
  if (!remotes) return;
  return parseGitHubURLLike((remotes[remote] as { url: string })?.url);
}
