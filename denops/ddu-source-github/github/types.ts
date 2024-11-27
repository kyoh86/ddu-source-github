import type { components } from "npm:@octokit/openapi-types@22.2.0";

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

type UserLike = {
  login: string;
};

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
    labels: {
      name: string;
    }[];
    user: UserLike | null;
    assignee: UserLike | null;
    assignees?: UserLike[] | null;
  }
  & Browsable;
export type Browsable = { html_url: string };
