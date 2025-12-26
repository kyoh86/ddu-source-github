import xdg from "@404wolf/xdg-portable";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import type { GitHubAppAuthentication } from "@octokit/auth-oauth-device";
import { is, type Predicate } from "@core/unknownutil";

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
      return {} as GitHubAppAuthentication;
    }
    return stored as GitHubAppAuthentication;
  } catch {
    return {} as GitHubAppAuthentication;
  }
}

export async function restoreAuthentication() {
  return await loadSafely();
}

export async function storeAuthentication(
  authentication: GitHubAppAuthentication,
) {
  await Deno.writeTextFile(
    await ensureSessionFilePath(),
    JSON.stringify(authentication),
  );
}

const isGitHubAppAuthentication = is.ObjectOf({
  clientType: is.LiteralOf("github-app"),
  clientId: is.String,
  type: is.LiteralOf("token"),
  tokenType: is.LiteralOf("oauth"),
  token: is.String,
}) satisfies Predicate<
  GitHubAppAuthentication
>;

export { isGitHubAppAuthentication };
