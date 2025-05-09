import type { Denops } from "jsr:@denops/std@~7.5.0";
import { ensure } from "jsr:@denops/std@~7.5.0/buffer";
import {
  charcol,
  getline,
  getreginfo,
  match,
  setreg,
  strcharpart,
} from "jsr:@denops/std@~7.5.0/function";

/**
 * Put text to the current cursor position.
 * @param denops Denops object
 * @param text Text to put
 * @param after If true, put text after the cursor
 */
export async function put(
  denops: Denops,
  bufnr: number,
  text: string,
  after: boolean,
) {
  // await batch(denops, async (denops) => {
  const oldReg = await getreginfo(denops, '"');

  await setreg(denops, '"', text, "v");
  try {
    await ensure(denops, bufnr, async () => {
      await denops.cmd(`normal! ""${after ? "p" : "P"}`);
    });
  } finally {
    if (oldReg) {
      await setreg(denops, '"', oldReg);
    }
  }
  // });
}

// Define a type for avoidable character classes
export type AvoidClass = "identifier" | "keyword" | "filename" | "printable";

/**
 * Creates a regex pattern based on the given avoid class.
 * @param avoidClass The class to create a pattern for.
 * @returns The regex pattern as a string.
 */
function getPatternForClass(
  avoidClass: AvoidClass | undefined,
): string | undefined {
  switch (avoidClass) {
    case "identifier":
      return "\\i";
    case "keyword":
      return "\\k";
    case "filename":
      return "\\f";
    case "printable":
      return "\\p";
  }
  return undefined;
}

/**
 * Get the characters before and after the cursor based on the `after` flag.
 * @param denops The Denops instance.
 * @param after True to get characters after the cursor, false for before.
 * @returns A tuple containing `charBefore` and `charAfter`.
 */
async function getNeighboringChars(
  denops: Denops,
  after: boolean,
): Promise<[string, string]> {
  const lineText = await getline(denops, ".");
  const colNum = await charcol(denops, ".");

  if (after) {
    // When pasting after the cursor
    return [
      await strcharpart(denops, lineText, colNum - 1, 1), // charBefore
      await strcharpart(denops, lineText, colNum, 1), // charAfter
    ];
  } else {
    // When pasting before the cursor
    return [
      colNum > 1 ? await strcharpart(denops, lineText, colNum - 2, 1) : "", // charBefore
      await strcharpart(denops, lineText, colNum - 1, 1), // charAfter
    ];
  }
}

/**
 * Pastes text with optional spacing based on the neighboring characters and a specified class
 * to avoid direct adjacency with characters of that class. The position relative to the cursor
 * is determined by the `after` parameter.
 *
 * @param denops The Denops instance to interact with Vim/Neovim.
 * @param text The text to be pasted.
 * @param after A boolean indicating whether to paste after the cursor (true) or before (false).
 * @param avoid The character class to check for spacing.
 */
export async function putWithSpacing(
  denops: Denops,
  bufnr: number,
  text: string,
  after: boolean,
  avoid?: AvoidClass,
): Promise<void> {
  // Save the current state of the register
  const reginfo = await getreginfo(denops, '"');

  // Create a regex pattern based on the class to avoid
  const pattern = getPatternForClass(avoid);
  if (!pattern || reginfo.regtype != "v") {
    return put(denops, bufnr, text, after);
  }

  // Get the appropriate characters based on the cursor position
  const [charBefore, charAfter] = await getNeighboringChars(denops, after);

  // Conditionally add spaces to the text to be pasted
  let textToPaste = text;
  if (reginfo.regtype === "v" && pattern) {
    if (await match(denops, charBefore, pattern) >= 0) {
      textToPaste = " " + textToPaste;
    }
    if (await match(denops, charAfter, pattern) >= 0) {
      textToPaste += " ";
    }
  }

  // Paste the text at the appropriate position
  await setreg(denops, '"', textToPaste, "c");
  await ensure(denops, bufnr, async () => {
    await denops.cmd(after ? "normal! p" : "normal! P");
  });

  // Restore the register's original content
  await setreg(denops, '"', reginfo.regcontents, reginfo.regtype);
}
