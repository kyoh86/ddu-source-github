import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { join } from "https://deno.land/std@0.194.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.194.0/fs/mod.ts";
import type {
  GitHubAppAuthentication,
} from "https://esm.sh/@octokit/auth-oauth-device@6.0.0?dts";

type Format = {
  [hostname: string]: GitHubAppAuthentication | undefined;
};

async function ensureSessionFilePath() {
  const dir = join(xdg.state(), "ddu-source-github");
  await ensureDir(dir);
  return join(dir, "github-session.json");
}

async function loadSafely() {
  const path = await ensureSessionFilePath();
  try {
    const stored = JSON.parse(await Deno.readTextFile(path));
    if (typeof stored !== "object") {
      return {} as Format;
    }
    return stored as Format;
  } catch {
    return {} as Format;
  }
}

export async function restoreAuthentication(hostname: string) {
  const stored = await loadSafely();
  return stored[hostname];
}

export async function storeAuthentication(
  hostname: string,
  authentication: GitHubAppAuthentication,
) {
  const stored = await loadSafely() || {} as Format;
  stored[hostname] = authentication;
  await Deno.writeTextFile(
    await ensureSessionFilePath(),
    JSON.stringify(stored),
  );
}
