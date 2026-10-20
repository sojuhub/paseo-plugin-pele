import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";

const LIMIT = 200_000;
export async function readDiagramFile(directory: string, path: string) {
  if (isAbsolute(path) || ![".md", ".markdown", ".mmd", ".mermaid"].includes(extname(path).toLowerCase())) {
    throw new Error("Enter a relative path to a Markdown or Mermaid file in this workspace.");
  }
  const root = await realpath(directory);
  const target = await realpath(resolve(root, path));
  const local = relative(root, target);
  if (local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) {
    throw new Error("Cannot open files outside the workspace.");
  }
  const file = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > LIMIT) throw new Error("Only regular files up to 200 KB can be opened.");
    const buffer = Buffer.alloc(LIMIT + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    if (bytesRead > LIMIT) throw new Error("The file is too large.");
    return { source: buffer.subarray(0, bytesRead).toString("utf8"), path: local };
  } finally {
    await file.close();
  }
}
