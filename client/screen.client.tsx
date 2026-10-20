import type { PluginTheme } from "@getpaseo/plugin";
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { ScrollView, TextInput, useToast } from "@getpaseo/plugin/client/react-native";
import { createElement, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Prose } from "./prose.client";
import { DiagramViewer } from "./viewer.client";
import { loadFile } from "../shared/contracts";
import { segmentMessage } from "../shared/message";

const SAMPLE = "flowchart LR\n  A[Order received] --> B{Payment confirmed?}\n  B -->|Yes| C[Prepare shipment]\n  B -->|No| D[Contact customer]";
type Props = { theme: PluginTheme; workspaceId?: string; compact?: boolean; params?: PluginScreenProps["params"] };

export function PeleScreen(props: PluginScreenProps) {
  return <PeleEditor theme={props.theme} params={props.params} compact={props.layout.compact} />;
}

export function PeleEditor({ theme, workspaceId, compact = false, params = {} }: Props) {
  const rpc = useRpc(loadFile);
  const toast = useToast();
  const [source, setSource] = useState(SAMPLE);
  const [draft, setDraft] = useState(SAMPLE);
  const [markdown, setMarkdown] = useState(false);
  const [path, setPath] = useState(params.path ?? "");
  const [loading, setLoading] = useState(false);
  const activeWorkspace = workspaceId ?? params.workspaceId;
  const segments = useMemo(() => {
    const parsed = segmentMessage(source);
    return parsed.some((segment) => segment.kind === "mermaid") || markdown
      ? parsed
      : [{ kind: "mermaid" as const, source, complete: true }];
  }, [source, markdown]);

  useEffect(() => { setPath(params.path ?? ""); }, [params.path]);
  async function openFile() {
    if (!activeWorkspace || !path.trim()) return;
    setLoading(true);
    try {
      const result = await rpc({ workspaceId: activeWorkspace, path: path.trim() });
      setSource(result.source);
      setDraft(result.source);
      setMarkdown(/\.(md|markdown)$/i.test(result.path));
      setPath(result.path);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally { setLoading(false); }
  }

  return <View testID="pele-editor" style={{ flex: 1, minWidth: 0, backgroundColor: theme.colors.surface0, padding: compact ? 10 : 18, gap: 10 }}>
    {activeWorkspace && <View style={{ flexDirection: "row", gap: 8 }}>
      <TextInput accessibilityLabel="Markdown or Mermaid file path" value={path} onChangeText={setPath}
        placeholder="path/to/diagram.mmd" placeholderTextColor={theme.colors.foregroundMuted}
        style={{ flex: 1, color: theme.colors.foreground, borderColor: theme.colors.border, borderWidth: 1, padding: 9 }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Load file" disabled={loading || !path.trim()} onPress={() => void openFile()}
        style={{ padding: 9, backgroundColor: theme.colors.accent, opacity: loading || !path.trim() ? 0.5 : 1 }}>
        <Text style={{ color: theme.colors.accentForeground }}>{loading ? "Loading…" : "Load"}</Text>
      </Pressable>
    </View>}
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
      <Text style={{ color: theme.colors.foregroundMuted }}>Mermaid and Pele code blocks render automatically in chat. Paste code or load a workspace file to preview it here.</Text>
      <TextInput accessibilityLabel="Mermaid source" multiline value={draft} onChangeText={setDraft} maxLength={200_000}
        style={{ color: theme.colors.foreground, backgroundColor: theme.colors.surface1, borderColor: theme.colors.border, borderWidth: 1, padding: 10, minHeight: 110, fontFamily: "monospace" }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Preview" onPress={() => setSource(draft)}
        style={{ padding: 9, backgroundColor: theme.colors.surface2 }}>
        <Text style={{ color: theme.colors.foreground }}>Preview</Text>
      </Pressable>
      {segments.map((segment, index) => segment.kind === "mermaid"
        ? createElement(DiagramViewer, { key: `diagram-${index}`, source: segment.source, phase: segment.complete ? "complete" : "streaming", theme, compact })
        : segment.text.trim() ? <Prose key={`text-${index}`} text={segment.text} theme={theme} compact={compact} /> : null)}
    </ScrollView>
  </View>;
}
