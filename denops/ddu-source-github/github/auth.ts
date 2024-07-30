import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { join } from "jsr:@std/path@1.0.2";
import { ensureDir } from "jsr:@std/fs@1.0.0";
import type {
  GitHubAppAuthentication,
} from "https://esm.sh/@octokit/auth-oauth-device@7.1.1";

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
  const host = hostname === "api.github.com" ? "github.com" : hostname;
  const stored = await loadSafely();
  return stored[host];
}

export async function storeAuthentication(
  hostname: string,
  authentication: GitHubAppAuthentication,
) {
  const host = hostname === "api.github.com" ? "github.com" : hostname;
  const stored = await loadSafely() || {} as Format;
  stored[host] = authentication;
  await Deno.writeTextFile(
    await ensureSessionFilePath(),
    JSON.stringify(stored),
  );
}
