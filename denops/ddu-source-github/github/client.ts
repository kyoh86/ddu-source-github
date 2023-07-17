import { restoreAuthentication, storeAuthentication } from "./auth.ts";
import { Octokit as OctokitCore } from "https://esm.sh/@octokit/core@5.0.0?dts";
import { restEndpointMethods } from "https://esm.sh/@octokit/plugin-rest-endpoint-methods@9.0.0?dts";
import { paginateRest } from "https://esm.sh/@octokit/plugin-paginate-rest@v8.0.0?dts";

export const Octokit = OctokitCore.plugin(restEndpointMethods).plugin(
  paginateRest,
);
import {
  createOAuthDeviceAuth,
  GitHubAppStrategyOptions,
} from "https://esm.sh/@octokit/auth-oauth-device@6.0.0?dts";
import { systemopen } from "https://deno.land/x/systemopen@v0.2.0/mod.ts";
// Workaround for https://github.com/octokit/auth-oauth-device.js/issues/162
// If the issue resolve, we can import type GitHubAppAuthenticationWithExpiration from "https://esm.sh/@octokit/auth-oauth-device@6.0.0?dts"
import type { GitHubAppAuthenticationWithExpiration } from "./types.ts";

async function getAuthentication(options: GitHubAppStrategyOptions) {
  const stored = await restoreAuthentication();
  if (stored && "expiresAt" in stored) {
    const withExpiration = stored as GitHubAppAuthenticationWithExpiration;
    if (withExpiration.expiresAt > new Date().toISOString()) {
      return stored;
    }
  }
  const auth = createOAuthDeviceAuth(options);

  const newone = await auth({ type: "oauth" });
  storeAuthentication(newone);
  return newone;
}

const ClientID = "Iv1.784dcbad252102e3";

export async function getClient() {
  const options: GitHubAppStrategyOptions = {
    clientType: "github-app",
    clientId: ClientID,
    onVerification: (verification) => {
      systemopen(verification.verification_uri);
      console.log("Open %s", verification.verification_uri);
      console.log("Enter code: %s", verification.user_code);
    },
  };
  const authentication = await getAuthentication(options);
  return new Octokit({
    authStrategy: createOAuthDeviceAuth,
    auth: {
      ...options,
      authentication,
    },
  });
}
