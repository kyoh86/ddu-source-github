import type { Denops } from "https://deno.land/x/denops_std@v5.1.0/mod.ts";

import { main as mainGitHub } from "./command/github/main.ts";

export function main(denops: Denops): void {
  mainGitHub(denops);
}
