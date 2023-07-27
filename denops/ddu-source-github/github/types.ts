import { components } from "https://raw.githubusercontent.com/octokit/openapi-types.ts/v18.0.0/packages/openapi-types/types.d.ts";

export type PullRequest = components["schemas"]["pull-request-simple"];
export type Issue = components["schemas"]["issue"];
export type IssueLike = { url: string; body?: string | null; html_url: string };
export type SimpleUser = components["schemas"]["simple-user"];
