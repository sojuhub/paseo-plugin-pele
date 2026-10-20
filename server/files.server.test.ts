import { expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readDiagramFile } from "./files.server";

test("file preview reads bounded workspace files and rejects escape paths", async () => {
  const temp = await mkdtemp(join(tmpdir(), "pele-test-"));
  const root = join(temp, "workspace");
  try {
    await mkdir(root);
    await writeFile(join(root, "diagram.mmd"), "flowchart LR\n A[주문] --> B[완료]");
    expect((await readDiagramFile(root, "diagram.mmd")).source).toContain("주문");
    await writeFile(join(temp, "outside.md"), "outside");
    await symlink(join(temp, "outside.md"), join(root, "escape.md"));
    for (const path of ["../outside.md", join(root, "diagram.mmd"), "escape.md", "secret.txt"]) {
      await expect(readDiagramFile(root, path)).rejects.toThrow();
    }
    await writeFile(join(root, "big.md"), "x".repeat(200_001));
    await expect(readDiagramFile(root, "big.md")).rejects.toThrow();
  } finally { await rm(temp, { recursive: true, force: true }); }
});
