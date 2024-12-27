import {
  BaseFilter,
  type FilterArguments,
} from "jsr:@shougo/ddu-vim@~9.3.0/filter";
import type { DduFilterItems } from "jsr:@shougo/ddu-vim@~9.3.0/types";
import type { IssueLike } from "../ddu-source-github/github/types.ts";

export type ActionData = Record<PropertyKey, never>;

type Params = Record<PropertyKey, never>;

export class Filter extends BaseFilter<Params> {
  override filter(
    { items, input }: FilterArguments<Params>,
  ): DduFilterItems | Promise<DduFilterItems> {
    const { match, rest } = parseQuery(input);
    const filtered = items.filter((item) => match(item.action as IssueLike));
    return {
      items: filtered,
      input: rest,
    };
  }
  override params(): Params {
    return {};
  }
}

// A query for matching IssueLike objects.
//
// Supported fields:
//   - label:...
//   - state:open
//   - state:close
//   - body:...
//   - user:...
//   - assignee:...
//
// Each field value can be enclosed in double quotes (e.g., "example").
// However, currently, escaping double quotes within a value is not supported.
interface Query {
  conditions: Conditions;
  rest: string;
  match: MatchIssueLike;
}

type MatchField = (issue: IssueLike, value: string) => boolean;
type MatchIssueLike = (issue: IssueLike) => boolean;

type Conditions = Partial<{
  label: string[];
  state: string[];
  body: string[];
  user: string[];
  assignee: string[];
}>;

const matchers: Record<keyof Conditions, MatchField> = {
  label: (issue, value) => issue.labels.some((label) => label.name === value),
  state: (issue, value) => issue.state === value,
  body: (issue, value) => issue.body?.includes(value) ?? false,
  user: (issue, value) => issue.user?.login === value,
  assignee: (issue, value) => (
    issue.assignee?.login === value ||
    (issue.assignees?.some((assignee) => assignee.login === value) ?? false)
  ),
};

const aliases: Record<keyof Conditions, string[]> = {
  label: ["label"],
  state: ["state", "is"],
  body: ["body"],
  user: ["user", "author"],
  assignee: ["assignee"],
};

function extractValue(
  query: string,
  startIndex: number,
): { value: string; nextIndex: number } {
  if (query[startIndex] === '"') {
    startIndex++;
    const endQuoteIndex = query.indexOf('"', startIndex);
    if (endQuoteIndex === -1) {
      throw new Error(
        `Unmatched double quote in query: "${
          query.slice(startIndex - 10, startIndex + 10)
        }"`,
      );
    }
    return {
      value: query.slice(startIndex, endQuoteIndex),
      nextIndex: endQuoteIndex + 1,
    };
  }

  const nextSpaceIndex = query.indexOf(" ", startIndex);
  if (nextSpaceIndex === -1) {
    return { value: query.slice(startIndex), nextIndex: query.length };
  }

  return {
    value: query.slice(startIndex, nextSpaceIndex),
    nextIndex: nextSpaceIndex + 1,
  };
}

function parseField(
  query: string,
  startIndex: number,
  fields: (keyof Conditions)[],
): { field: keyof Conditions; value: string; nextIndex: number } | null {
  for (const field of fields) {
    const key = aliases[field].find((a) =>
      query.startsWith(a + ":", startIndex)
    );
    if (!key) {
      continue;
    }
    const c = startIndex + key.length + 1;
    const { value, nextIndex } = extractValue(query, c);
    return { field, value, nextIndex };
  }
  return null;
}

export function parseQuery(query: string): Query {
  const conditions: Conditions = {};
  const restWords: string[] = [];

  const prefixes = Object.keys(matchers) as (keyof Conditions)[];

  let c = 0;
  while (c < query.length) {
    const result = parseField(query, c, prefixes);
    if (result) {
      const { field, value, nextIndex } = result;
      if (conditions[field]) {
        conditions[field].push(value);
      } else {
        conditions[field] = [value];
      }
      c = nextIndex;
    } else {
      const nextSpaceIndex = query.indexOf(" ", c);
      if (nextSpaceIndex === -1) {
        restWords.push(query.slice(c));
        break;
      } else {
        restWords.push(query.slice(c, nextSpaceIndex));
        c = nextSpaceIndex + 1;
      }
    }
  }

  return {
    conditions,
    rest: restWords.join(" "),
    match: (issue: IssueLike) =>
      Object.entries(conditions).every(([field, values]) => {
        const matcher = matchers[field as keyof Conditions];
        return matcher ? values.every((value) => matcher(issue, value)) : true;
      }),
  };
}
