import { restoreAuthentication, storeAuthentication } from "./auth.ts";
import { Octokit as OctokitCore } from "https://esm.sh/@octokit/core@6.1.2";
import { restEndpointMethods } from "https://esm.sh/@octokit/plugin-rest-endpoint-methods@13.2.4";
import { paginateRest } from "https://esm.sh/@octokit/plugin-paginate-rest@11.3.3";

export const Octokit = OctokitCore.plugin(restEndpointMethods).plugin(
  paginateRest,
);
import {
  createOAuthDeviceAuth,
  type GitHubAppStrategyOptions,
} from "https://esm.sh/@octokit/auth-oauth-device@7.1.1";
import { systemopen } from "jsr:@lambdalisue/systemopen@~1.0.0";

export async function authenticate(
  hostname: string,
  force?: boolean,
) {
  const options: GitHubAppStrategyOptions = {
    clientType: "github-app",
    clientId: ClientID,
    onVerification: (verification) => {
      console.info("Open", verification.verification_uri);
      console.info("Enter code:", verification.user_code);
      systemopen(verification.verification_uri);
      // TODO: If it does not inistalled, ddu-source-github should be installed.
      // https://github.com/settings/apps/ddu-source-github/installations
    },
  };
  const stored = await restoreAuthentication(hostname);
  if (!force && stored) {
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
    auth: await authenticate(hostname),
  });
}
