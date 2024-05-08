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
} from "https://esm.sh/@octokit/auth-oauth-device@7.1.1";
import { systemopen } from "https://deno.land/x/systemopen@v1.0.0/mod.ts";

async function getOptions(hostname: string, options: GitHubAppStrategyOptions) {
  const stored = await restoreAuthentication(hostname);
  if (stored) {
    return {
      ...options,
      authentication: stored,
    };
  }
  const auth = createOAuthDeviceAuth(options);

  const newone = await auth({ type: "oauth" });
  storeAuthentication(hostname, newone);
  return {
    ...options,
    authentication: newone,
  };
}

const ClientID = "Iv1.784dcbad252102e3";

export async function getClient(hostname: string) {
  return new Octokit({
    authStrategy: createOAuthDeviceAuth,
    auth: await getOptions(hostname, {
      clientType: "github-app",
      clientId: ClientID,
      onVerification: (verification) => {
        console.info("Open", verification.verification_uri);
        console.info("Enter code:", verification.user_code);
        systemopen(verification.verification_uri);
        // TODO: If it does not inistalled, ddu-source-github should be installed.
        // https://github.com/settings/apps/ddu-source-github/installations
      },
    }),
  });
}
