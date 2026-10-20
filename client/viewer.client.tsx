import type { PluginTheme } from "@getpaseo/plugin";
import { copyText, Icon, useToast } from "@getpaseo/plugin/client/react-native";
import { createElement, useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View, ScrollView, Modal, useWindowDimensions } from "react-native";
import { mount, renderOptions, type Mounted } from "../shared/render";

type Props = { source: string; phase?: "streaming" | "complete"; theme: PluginTheme; compact: boolean };
type WebSurface = Parameters<typeof mount>[0] & {
  clientWidth: number;
  querySelector(selector: "svg"): { style: { width: string; height: string; maxWidth: string; flexShrink: string } } | null;
};

function IconButton({ label, icon, disabled, onPress, theme, compact }: {
  label: string; icon: string; disabled?: boolean; onPress(): void; theme: PluginTheme; compact: boolean;
}) {
  return createElement("div", { title: label },
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      hitSlop={compact ? 6 : 4}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => ({
        width: compact ? 32 : 20, height: compact ? 32 : 20, borderRadius: 6,
        alignItems: "center", justifyContent: "center",
        backgroundColor: hovered || pressed ? theme.colors.surface1 : theme.colors.surface2,
        opacity: disabled ? 0.5 : 1,
      })}>
      {({ hovered }: { hovered?: boolean; pressed: boolean }) => <Icon name={icon} size={compact ? 18 : 14}
        color={hovered ? theme.colors.foreground : theme.colors.foregroundMuted} />}
    </Pressable>);
}

export function DiagramViewer(props: Props) {
  const [expanded, setExpanded] = useState(false);
  return <>
    <DiagramBody {...props} expand={() => setExpanded(true)} />
    <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
      {expanded && <DiagramBody {...props} fullscreen close={() => setExpanded(false)} />}
    </Modal>
  </>;
}

function DiagramBody({ source, phase = "complete", theme, compact, fullscreen = false, expand, close }:
  Props & { fullscreen?: boolean; expand?: () => void; close?: () => void }) {
  const [showSource, setShowSource] = useState(Platform.OS !== "web");
  const [stableSource, setStableSource] = useState(source);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("");
  const [scale, setScale] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [fitScale, setFitScale] = useState(1);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [height, setHeight] = useState(180);
  const host = useRef<WebSurface | null>(null);
  const diagram = useRef<Mounted | null>(null);
  const naturalWidth = useRef(0);
  const focusTarget = useRef<{ focus(): void } | null>(null);
  useEffect(() => { if (fullscreen) focusTarget.current?.focus(); }, [fullscreen]);
  const latestSource = useRef(stableSource);
  latestSource.current = stableSource;
  const toast = useToast();
  const windowSize = useWindowDimensions();
  const maxHeight = fullscreen ? Math.max(180, windowSize.height - 32) : 420;
  const ready = !!kind && !error;

  useEffect(() => {
    if (phase === "complete") { setStableSource(source); return; }
    const timer = setTimeout(() => setStableSource(source), 160);
    return () => clearTimeout(timer);
  }, [source, phase]);

  useEffect(() => {
    if (showSource || Platform.OS !== "web" || !host.current) return;
    const element = host.current;
    const zoomOptions = { always: true, controls: false, maxScale: 8 };
    const mounted = mount(element, latestSource.current, {
      ...renderOptions,
      zoom: zoomOptions,
      onRender(result) {
        naturalWidth.current = result.width;
        const fitted = Math.min(fullscreen ? Infinity : 1, element.clientWidth / result.width, maxHeight / result.height);
        zoomOptions.maxScale = fitted * 8;
        const svg = element.querySelector("svg");
        if (svg) {
          svg.style.width = `${result.width * fitted}px`;
          svg.style.height = "auto";
          svg.style.maxWidth = "100%";
          svg.style.flexShrink = "0";
        }
        setHeight(Math.max(100, result.height * fitted));
        setError("");
        setKind(result.type);
        setScale(fitted);
        setFitScale(fitted);
        diagram.current?.zoom?.refresh();
      },
      onError(reason) { setError(reason instanceof Error ? reason.message : String(reason)); },
    });
    diagram.current = mounted;
    mounted.zoom?.refresh();
    return () => { mounted.destroy(); diagram.current = null; };
  }, [showSource, maxHeight, availableWidth]);

  useEffect(() => { diagram.current?.update(stableSource); }, [stableSource]);

  function readScale() {
    // Pele updates zoom during the native pointer/wheel handler.
    setTimeout(() => { if (diagram.current?.zoom) setScale(diagram.current.zoom.scale); }, 0);
  }
  function zoom(action: "in" | "out" | "fit") {
    const control = diagram.current?.zoom;
    const svg = host.current?.querySelector("svg");
    if (!control || !svg) return;
    const target = action === "fit" ? fitScale : Math.min(fitScale * 8,
      Math.max(fitScale * (fullscreen ? 1 : 0.25), control.scale * (action === "in" ? 1.25 : 0.8)));
    control.reset();
    svg.style.width = `${naturalWidth.current * Math.min(target, fitScale)}px`;
    svg.style.height = "auto";
    control.refresh();
    if (target > fitScale) control.zoomTo(target);
    setScale(control.scale);
  }
  async function copy() {
    try { await copyText(source); toast.show("Code copied."); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Failed to copy code."); }
  }

  const visible = hovered || focused || touched || compact || showSource;
  return createElement("div", {
    "data-testid": "pele-diagram", tabIndex: 0, ref: focusTarget,
    onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false),
    onFocusCapture: () => setFocused(true),
    onBlurCapture: (event: { currentTarget: { contains(node: unknown): boolean }; relatedTarget: unknown }) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    },
    onPointerDownCapture: (event: { pointerType: string }) => { if (event.pointerType === "touch") setTouched(true); },
    onKeyDown: (event: { key: string; preventDefault(): void; stopPropagation(): void }) => {
      if (event.key === "Escape" && close) { event.preventDefault(); event.stopPropagation(); close(); }
    },
    style: { position: "relative", minWidth: 0, minHeight: 56, outline: "none",
      padding: fullscreen ? 16 : 0, paddingTop: fullscreen ? 16 : compact && !showSource ? 48 : 0,
      height: fullscreen ? "100vh" : undefined,
      boxSizing: "border-box", backgroundColor: theme.colors.surface0 },
  }, <>
    <View pointerEvents="none" onLayout={({ nativeEvent }) => {
      const width = Math.round(nativeEvent.layout.width);
      if (width > 0) setAvailableWidth(width);
    }} style={{ position: "absolute", left: 0, right: 0, height: 0 }} />
    {createElement("div", { "data-testid": "pele-toolbar", style: {
      position: "absolute", top: 8, right: 8, zIndex: 2, display: "flex", gap: 4,
      opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
    } }, <>
      {!showSource && <>
        <IconButton label="Zoom in" icon="ZoomIn" theme={theme} compact={compact} disabled={!ready || scale >= fitScale * 8 - 0.001} onPress={() => zoom("in")} />
        <IconButton label="Zoom out" icon="ZoomOut" theme={theme} compact={compact} disabled={!ready || scale <= fitScale * (fullscreen ? 1 : 0.25) + 0.001} onPress={() => zoom("out")} />
        <IconButton label="Reset view" icon="Scan" theme={theme} compact={compact} disabled={!ready || Math.abs(scale - fitScale) < 0.001} onPress={() => zoom("fit")} />
      </>}
      {!fullscreen && <IconButton label={showSource ? "View diagram" : "View source"} icon={showSource ? "Workflow" : "Code"}
        theme={theme} compact={compact} disabled={Platform.OS !== "web"} onPress={() => setShowSource(!showSource)} />}
      {showSource && <IconButton label="Copy code" icon="Copy" theme={theme} compact={compact} onPress={() => { void copy(); }} />}
      {expand && !showSource && <IconButton label="Fullscreen" icon="Maximize2" theme={theme} compact={compact} onPress={expand} />}
      {close && <IconButton label="Close" icon="X" theme={theme} compact={compact} onPress={close} />}
    </>)}
    {showSource ? <ScrollView style={{ maxHeight, paddingTop: compact ? 48 : 36 }} horizontal>
      <Text selectable style={{ color: theme.colors.foreground, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 13, lineHeight: 20, padding: 8 }}>{source}</Text>
    </ScrollView> : createElement("div", {
      ref: host,
      "data-testid": "pele-live-svg",
      "aria-label": "Pele diagram. Drag to pan, control or command wheel to zoom.",
      onPointerUp: readScale, onKeyUp: readScale,
      onWheel: (event: { ctrlKey: boolean; metaKey: boolean; deltaY: number }) => {
        if (fullscreen && !event.ctrlKey && !event.metaKey) {
          diagram.current?.zoom?.zoomBy(2 ** (Math.max(-24, Math.min(24, -event.deltaY)) * 0.02));
        }
        readScale();
      },
      onDoubleClick: () => zoom("fit"),
      style: { position: "relative", width: "100%", height: fullscreen ? maxHeight : height,
        minHeight: 100, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui, sans-serif", fontSize: 16,
        "--pele-bg": theme.colors.surface0, "--pele-fg": theme.colors.foreground,
        "--pele-muted": theme.colors.foregroundMuted, "--pele-line": theme.colors.foreground,
        "--pele-surface": theme.colors.surface1, "--pele-surface-alt": theme.colors.surface2,
        "--pele-border": theme.colors.border, "--pele-accent": theme.colors.accent,
        "--pele-error": theme.colors.statusDanger },
    })}
    {!!error && <Text accessibilityRole="alert" selectable
      style={{ color: theme.colors.statusDanger, fontSize: 12 }}>
      {phase === "streaming" ? "Rendering diagram…" : `Unable to render diagram: ${error}`}
    </Text>}
  </>);
}
