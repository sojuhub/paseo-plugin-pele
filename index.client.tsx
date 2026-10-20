import type { PluginClientContext, PluginSidebarItemProps, PluginTimelineItemProps, PluginWorkspacePanelProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { Platform } from "react-native";
import { Prose } from "./client/prose.client";
import { DiagramViewer } from "./client/viewer.client";
import { PeleEditor, PeleScreen } from "./client/screen.client";
import { diagramSchema, proseSchema } from "./shared/contracts";
import { splitMessage } from "./shared/message";

function Sidebar({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return <SidebarRow icon="Workflow" active={currentScreen?.screenId === "pele"} onPress={() => openScreen({ screenId: "pele" })} />;
}

function WorkspacePanel(props: PluginWorkspacePanelProps) {
  return <PeleEditor theme={props.theme} workspaceId={props.workspaceId} compact={props.layout.compact} />;
}

function DiagramItem({ item, theme, layout }: PluginTimelineItemProps<{ source: string; phase: "streaming" | "complete" }>) {
  return <DiagramViewer source={item.data.source} phase={item.data.phase} theme={theme} compact={layout.compact} />;
}

function ProseItem({ item, theme, layout }: PluginTimelineItemProps<{ text: string }>) {
  return <Prose text={item.data.text} theme={theme} compact={layout.compact} />;
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "pele", title: "Pele", Component: PeleScreen });
  client.addSidebarHeaderItem({ id: "pele", title: "Pele", Component: Sidebar });
  client.addWorkspacePanel({ id: "pele", title: "Pele", icon: "Workflow", context: "workspace", Component: WorkspacePanel });
  client.addCommandCenterItem({ id: "open-pele", title: "Open Pele diagrams", icon: "Workflow", context: "global", onSelect: ({ openScreen }) => openScreen({ screenId: "pele" }) });
  client.addCommandCenterItem({ id: "open-pele-workspace", title: "Open Pele in workspace", icon: "Workflow", context: "workspace", onSelect: ({ openPanel }) => openPanel("pele") });
  client.addSlashCommand({ name: "pele", description: "Open a Mermaid or Pele file", argumentHint: "path/to/file.mmd", context: "workspace", onSubmit: ({ args, workspace, openScreen }) => openScreen({ screenId: "pele", params: { workspaceId: workspace.id, path: args.trim() } }) });

  if (Platform.OS !== "web") return () => {};
  const cleanups = [
    client.addTimelineTransformer({ id: "pele-assistant", query: { itemType: "assistant_message" }, transform: ({ item, phase }) => splitMessage(item.text, phase) }),
    client.addTimelineTransformer({ id: "pele-user", query: { itemType: "user_message" }, transform: ({ item, phase }) => splitMessage(item.text, phase) }),
    client.addTimelineTransformer({ id: "pele-reasoning", query: { itemType: "reasoning" }, transform: ({ item, phase }) => splitMessage(item.text, phase) }),
  ];
  const renderers = [
    client.addTimelineRenderer({ kind: "pele-diagram", version: 1, schema: diagramSchema, Component: DiagramItem }),
    client.addTimelineRenderer({ kind: "pele-text", version: 1, schema: proseSchema, Component: ProseItem }),
  ];
  return () => { cleanups.forEach((cleanup) => cleanup()); renderers.forEach((cleanup) => cleanup()); };
}
