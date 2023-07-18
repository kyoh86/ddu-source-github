import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { join } from "https://deno.land/std@0.194.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.194.0/fs/mod.ts";
import type {
  GitHubAppAuthentication,
} from "https://esm.sh/@octokit/auth-oauth-device@6.0.0?dts";

async function ensureSessionFilePath() {
  const dir = join(xdg.state(), "ddu-source-github");
  await ensureDir(dir);
  return join(dir, "github-session.json");
}

export async function restoreAuthentication() {
  try {
    return JSON.parse(
      await Deno.readTextFile(await ensureSessionFilePath()),
    ) as GitHubAppAuthentication;
  } catch {
    return undefined;
  }
}

export async function storeAuthentication(
  authentication: GitHubAppAuthentication,
) {
  await Deno.writeTextFile(
    await ensureSessionFilePath(),
    JSON.stringify(authentication),
  );
}
