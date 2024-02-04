import { assertEquals } from "https://deno.land/std@0.214.0/assert/mod.ts";
import { test } from "https://deno.land/x/denops_test@v1.6.2/mod.ts";
import * as testtarget from "./issue_like.ts";

test({
  mode: "all",
  name: "evalFormat can eval empty format string to empty string",
  fn: () => {
    const got = testtarget.evalFormat({}, "");
    assertEquals(got, "");
  },
});

test({
  mode: "all",
  name: "evalFormat can eval format including single property to the value",
  fn: () => {
    const got = testtarget.evalFormat({ x: "foo" }, "${this.x}");
    assertEquals(got, "foo");
  },
});

test({
  mode: "all",
  name: "evalFormat can eval format including some properties",
  fn: () => {
    const got = testtarget.evalFormat(
      { x: "foo", y: "bar" },
      "${this.x}/${this.y}",
    );
    assertEquals(got, "foo/bar");
  },
});

test({
  mode: "all",
  name: "evalFormat can escape format notation",
  fn: () => {
    const got = testtarget.evalFormat(
      { x: "foo", y: "bar" },
      "${this.x}/\\${y}",
    );
    assertEquals(got, "foo/${y}");
  },
});
