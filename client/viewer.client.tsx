import type { PluginTheme } from "@getpaseo/plugin";
import { copyText, useToast } from "@getpaseo/plugin/client/react-native";
import { useEffect, useRef, useState } from "react";
import { Modal, Platform, ScrollView, Text } from "react-native";
import { diagramPalette } from "../shared/presentation";
import { renderVector } from "../shared/render";
import { ZoomableViewport } from "./viewport.client";
import { IconButton } from "./toolbar.client";

type Props = { source: string; phase?: "streaming" | "complete"; theme: PluginTheme; compact: boolean };
type Diagram = ReturnType<typeof renderVector>;

function Vector({ diagram }: { diagram: Diagram }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    host.current.innerHTML = diagram.svg;
    const svg = host.current.querySelector("svg");
    if (svg) { svg.style.width = "100%"; svg.style.height = "100%"; svg.style.maxWidth = "none"; }
  }, [diagram]);
  return <div ref={host} data-testid="pele-vector" style={{ width: "100%", height: "100%" }} />;
}

export function DiagramViewer({ source, phase = "complete", theme, compact }: Props) {
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [error, setError] = useState("");
  const [showSource, setShowSource] = useState(Platform.OS !== "web");
  const [expanded, setExpanded] = useState(false);
  const toast = useToast();
  const palette = diagramPalette(theme.colors.surface0);
  const colors = {
    "--pele-bg": theme.colors.surface0, "--pele-fg": palette.text, "--pele-muted": palette.text,
    "--pele-line": palette.line, "--pele-surface": palette.node, "--pele-surface-alt": palette.cluster,
    "--pele-border": palette.border, "--pele-accent": theme.colors.accent, "--pele-radius": "5px",
    "--pele-error": theme.colors.statusDanger,
  } as React.CSSProperties;

  useEffect(() => {
    const render = () => {
      try { setDiagram(renderVector(source)); setError(""); }
      catch (reason) {
        if (phase === "complete") {
          setDiagram(null);
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      }
    };
    if (phase === "complete") { render(); return; }
    const timer = setTimeout(render, 160);
    return () => clearTimeout(timer);
  }, [source, phase]);

  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [expanded]);

  async function copy() {
    try { await copyText(source); toast.show("Code copied."); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Failed to copy code."); }
  }

  return <div data-testid="pele-diagram" style={{ ...colors, position: "relative", minWidth: 0 }}>
    {showSource || !diagram ? <div style={{ position: "relative" }}>
      <ScrollView horizontal>
        <Text selectable style={{ color: theme.colors.foreground, fontFamily: "monospace", fontSize: 13,
          lineHeight: 20, padding: 12, paddingTop: 40 }}>{source}</Text>
      </ScrollView>
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
        <IconButton label="Copy code" icon="Copy" theme={theme} compact={compact} onPress={() => { void copy(); }} />
        {!!diagram && <IconButton label="View diagram" icon="Workflow" theme={theme} compact={compact} onPress={() => setShowSource(false)} />}
      </div>
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.colors.statusDanger }}>{error}</Text>}
    </div> : <ZoomableViewport
      theme={theme} compact={compact} contentSize={diagram} accessibilityLabel="Diagram"
      testID="pele-live-svg" wheelActivation="modifier"
      style={{ height: Math.max(diagram.height, 56), minHeight: 56, flexBasis: "auto", flexGrow: 0, flexShrink: 0 }}
      actions={[
        { icon: "Code", label: "View source", onPress: () => setShowSource(true) },
        { icon: "Maximize2", label: "Fullscreen", onPress: () => setExpanded(true) },
      ]}>
      <Vector diagram={diagram} />
    </ZoomableViewport>}
    <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
      {expanded && diagram && <div tabIndex={-1} ref={element => element?.focus()}
        style={{ ...colors, position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          outline: "none", backgroundColor: theme.colors.surface0 }}>
        <ZoomableViewport theme={theme} compact={compact} contentSize={diagram} fit={{ padding: 24 }}
          minScale={1} wheelActivation="always" accessibilityLabel="Diagram fullscreen" testID="pele-fullscreen"
          onPressOutsideContent={() => setExpanded(false)}
          actions={[{ icon: "X", label: "Close", onPress: () => setExpanded(false) }]}>
          <Vector diagram={diagram} />
        </ZoomableViewport>
      </div>}
    </Modal>
  </div>;
}
