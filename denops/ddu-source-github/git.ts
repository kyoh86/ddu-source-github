import { dirname, join } from "https://deno.land/std@0.193.0/path/mod.ts";
import { decode } from "https://deno.land/x/ini@v2.1.0/mod.ts";

export async function gitdir(path: string) {
  const start = path;
  while (true) {
    const next = dirname(path);
    if (next === path) {
      return;
    }
    path = next;
    const candidate = join(path, ".git");
    const stat = await Deno.stat(candidate);
    if (stat.isDirectory) {
      return {
        path,
        gitdir: candidate,
        prefix: start.substring(path.length + 1),
      };
    } else if (stat.isFile) {
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
    if (!m) {
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
