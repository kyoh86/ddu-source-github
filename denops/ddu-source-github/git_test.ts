import { assertEquals } from "https://deno.land/std@0.216.0/assert/mod.ts";
import { parseGitHubURLLike } from "./git.ts";

Deno.test("parse GitHub URL #1 - undefined", () => {
  assertEquals(parseGitHubURLLike(undefined), undefined);
});

Deno.test("parse GitHub URL #2 - https welformed", () => {
  assertEquals(
    parseGitHubURLLike("https://github.com/kyoh86/ddu-source-github.git"),
    {
      hostname: "github.com",
      owner: "kyoh86",
      name: "ddu-source-github",
    },
  );
});

Deno.test("parse GitHub URL #3 - git welformed", () => {
  assertEquals(
    parseGitHubURLLike("git@github.com:kyoh86/ddu-source-github.git"),
    {
      hostname: "github.com",
      owner: "kyoh86",
      name: "ddu-source-github",
    },
  );
});

Deno.test("parse GitHub URL #4 - ssh welformed", () => {
  assertEquals(
    parseGitHubURLLike("ssh://git@github.com/kyoh86/ddu-source-github.git"),
    {
      hostname: "github.com",
      owner: "kyoh86",
      name: "ddu-source-github",
    },
  );
});
