// Workaround for https://github.com/octokit/auth-oauth-device.js/issues/162
// If the issue resolve, we can import type GitHubAppAuthenticationWithExpiration from "https://esm.sh/@octokit/auth-oauth-device@6.0.0?dts"
import type { GitHubAppAuthenticationWithRefreshToken } from "https://esm.sh/v128/@octokit/oauth-methods@4.0.0/dist-types/index.d.ts";
export type GitHubAppAuthenticationWithExpiration = {
  type: "token";
  tokenType: "oauth";
} & Omit<GitHubAppAuthenticationWithRefreshToken, "clientSecret">;
