import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const loadFile = defineRpc({
  name: "pele.file",
  input: z.object({ workspaceId: z.string().min(1), path: z.string().min(1).max(4096) }),
  output: z.object({ source: z.string().max(200_000), path: z.string() }),
});
export const diagramSchema = z.object({ source: z.string(), phase: z.enum(["streaming", "complete"]) });
export const proseSchema = z.object({ text: z.string() });
