import { assertEquals } from "jsr:@std/assert@1.0.14";
import { parseQuery } from "../denops/@ddu-filters/matcher_github_issue_like.ts";

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
