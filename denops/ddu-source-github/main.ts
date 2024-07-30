import type { Denops } from "jsr:@denops/std@7.0.0";

import { main as mainGitHub } from "./command/github/main.ts";

export function main(denops: Denops): void {
  mainGitHub(denops);
}
