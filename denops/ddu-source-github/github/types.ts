import { is, maybe } from "jsr:@core/unknownutil@^4.3.0";
import type { components } from "npm:@octokit/openapi-types@25.0.0";

export type IssueLikeState = "open" | "closed" | "all";
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

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends
  readonly (infer ElementType)[] ? ElementType : never;

type CommonFields<A, B> = {
  [K in keyof A & keyof B]: A[K] extends B[K] ? B[K] extends A[K] ? A[K]
    : never
    : never;
};

export type PullRequestLike = CommonFields<PullRequest, SearchedIssue>;

export type Label = ArrayElement<Issue["labels"]>;

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
    labels: LabelLike[];
    user: UserLike | null;
    assignee: UserLike | null;
    assignees?: UserLike[] | null;
  }
  & Browsable;

export type LabelLike = {
  name: string;
};

export function ingestLabels(labels: Label[]) {
  return labels.map((
    l,
  ) => (typeof l === "string"
    ? { name: l ?? "" }
    : { ...l, name: l.name ?? "" })
  );
}

export type Browsable = { html_url: string };

export const ControllerClosed =
  "The stream controller cannot close or enqueue" as const;

export function maybeControllerClosed(e: unknown) {
  const err = maybe(e, is.ObjectOf({ message: is.String }));
  if (err && err.message === ControllerClosed) {
    return ControllerClosed;
  }
  return undefined;
}
