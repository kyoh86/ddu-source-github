import type { components } from "https://raw.githubusercontent.com/octokit/openapi-types.ts/v22.1.0/packages/openapi-types/types.d.ts";

export type Repository = components["schemas"]["repo-search-result-item"];
export type PullRequest =
  | components["schemas"]["pull-request-simple"]
  | components["schemas"]["pull-request"];
export type Issue = components["schemas"]["issue"];
export type SearchedIssue = components["schemas"]["issue-search-result-item"];
export type SimpleUser =
  | components["schemas"]["simple-user"]
  | components["schemas"]["private-user"]
  | components["schemas"]["public-user"];

export type IssueLike =
  & {
    number: number;
    title: string;
    url: string;
    body?: string | null;
    state: string;
    repository?: {
      full_name: string;
    };
  }
  & Browsable;
export type Browsable = { html_url: string };
