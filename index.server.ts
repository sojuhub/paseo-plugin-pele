import type { PluginServerContext } from "@getpaseo/plugin/server";
import { loadFile } from "./shared/contracts";
import { readDiagramFile } from "./server/files.server";

export default function contribute(server: PluginServerContext) {
  server.handle(loadFile, async ({ workspaceId, path }, { paseo }) => {
    const workspace = await paseo.workspaces.ref(workspaceId).refresh();
    if (!workspace) throw new Error("Workspace not found.");
    return readDiagramFile(workspace.workspaceDirectory, path);
  });
  return () => {};
}
