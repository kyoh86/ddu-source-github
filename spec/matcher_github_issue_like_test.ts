import { assertEquals } from "@std/assert";
import { parseQuery } from "../denops/@ddu-filters/matcher_github_issue_like/main.ts";

Deno.test("parse query", () => {
  const query = parseQuery(
    "author:kyoh86 user:kyoh86-tryout is:open state:close foo",
  );
  assertEquals(query.conditions, {
    user: ["kyoh86", "kyoh86-tryout"],
    state: ["open", "close"],
  });
  assertEquals(query.rest, "foo");
});
