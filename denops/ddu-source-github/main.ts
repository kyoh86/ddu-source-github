import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";

import { main as mainIssue } from "./command/issue/main.ts";

export function main(denops: Denops): void {
  mainIssue(denops);
}
