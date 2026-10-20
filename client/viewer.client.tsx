import type { PluginTheme } from "@getpaseo/plugin";
import { copyText, Icon, useToast } from "@getpaseo/plugin/client/react-native";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View, ScrollView, Modal, useWindowDimensions } from "react-native";
import { diagramPalette, fitDiagram, zoomAt, type DiagramSize } from "../shared/presentation";
import { MermaidSurface } from "./mermaid.client";
import { renderVector, usesPeleEngine } from "../shared/render";

type Props = { source: string; phase?: "streaming" | "complete"; theme: PluginTheme; compact: boolean };
const REST = { zoom: 1, x: 0, y: 0 };

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
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState<DiagramSize>({ width: 240, height: 180 });
  const [availableWidth, setAvailableWidth] = useState(0);
  const [transform, setTransform] = useState(REST);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const focusTarget = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const toast = useToast();
  const windowSize = useWindowDimensions();
  const maxHeight = fullscreen ? Math.max(180, windowSize.height - (compact ? 64 : 32)) : undefined;
  const fitted = fitDiagram(size, Math.max(1, availableWidth - (fullscreen ? 32 : 0)), maxHeight);
  const height = maxHeight ?? Math.max(100, size.height * fitted);
  const palette = diagramPalette(theme.colors.surface0);
  const pele = usesPeleEngine(stableSource);
  const onRendered = useCallback((next: DiagramSize) => {
    setSize({ width: next.width, height: next.height });
    setReady(true); setError(""); setTransform(REST);
  }, []);
  const onError = useCallback((message: string) => { setError(message); setReady(false); }, []);

  useEffect(() => { if (fullscreen) focusTarget.current?.focus(); }, [fullscreen]);
  useEffect(() => { setTransform(REST); pointers.current.clear(); }, [availableWidth, maxHeight, showSource]);
  useEffect(() => {
    if (phase === "complete") { setStableSource(source); return; }
    const timer = setTimeout(() => setStableSource(source), 160);
    return () => clearTimeout(timer);
  }, [source, phase]);
  useEffect(() => {
    if (showSource || !pele || !host.current || availableWidth <= 0) return;
    try {
      const result = renderVector(stableSource, availableWidth);
      host.current.innerHTML = result.svg;
      const svg = host.current.querySelector("svg");
      if (svg) { svg.style.width = "100%"; svg.style.height = "100%"; svg.style.maxWidth = "none"; }
      onRendered(result);
    } catch (reason) { onError(reason instanceof Error ? reason.message : String(reason)); }
  }, [stableSource, pele, showSource, availableWidth, onRendered, onError]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (!fullscreen && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const point = { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
      setTransform(t => zoomAt(t, Math.max(0.25, Math.min(8, t.zoom * 2 ** (-Math.max(-60, Math.min(60, event.deltaY)) * 0.01))), point));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [fullscreen, showSource]);

  function zoom(action: "in" | "out" | "fit") {
    setTransform(current => action === "fit" ? REST : zoomAt(current,
      Math.max(0.25, Math.min(8, current.zoom * (action === "in" ? 1.25 : 0.8)))));
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
    onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    },
    onPointerDownCapture: (event: React.PointerEvent) => { if (event.pointerType === "touch") setTouched(true); },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Escape" && close) { event.preventDefault(); event.stopPropagation(); close(); }
      if (showSource || !ready) return;
      if (event.key === "+" || event.key === "=") { event.preventDefault(); zoom("in"); }
      if (event.key === "-") { event.preventDefault(); zoom("out"); }
      if (event.key === "0" || event.key === "Home") { event.preventDefault(); zoom("fit"); }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        setTransform(t => ({ ...t, x: t.x + (event.key === "ArrowLeft" ? 48 : event.key === "ArrowRight" ? -48 : 0),
          y: t.y + (event.key === "ArrowUp" ? 48 : event.key === "ArrowDown" ? -48 : 0) }));
      }
    },
    style: { position: "relative", minWidth: 0, minHeight: 56, outline: "none",
      padding: fullscreen ? 16 : 0, paddingTop: compact && !showSource ? 48 : fullscreen ? 16 : 0,
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
        <IconButton label="Zoom in" icon="ZoomIn" theme={theme} compact={compact} disabled={!ready || transform.zoom >= 8} onPress={() => zoom("in")} />
        <IconButton label="Zoom out" icon="ZoomOut" theme={theme} compact={compact} disabled={!ready || transform.zoom <= 0.25} onPress={() => zoom("out")} />
        <IconButton label="Reset view" icon="Scan" theme={theme} compact={compact} disabled={!ready} onPress={() => zoom("fit")} />
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
      ref: viewport, "data-testid": "pele-live-svg", role: "img", "aria-label": `Diagram: ${stableSource}`,
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        const previous = pointers.current.get(event.pointerId);
        if (!previous) return;
        const next = { x: event.clientX, y: event.clientY };
        const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
        pointers.current.set(event.pointerId, next);
        if (other) {
          const oldDistance = Math.hypot(previous.x - other.x, previous.y - other.y);
          const distance = Math.hypot(next.x - other.x, next.y - other.y);
          if (oldDistance > 0) setTransform(t => zoomAt(t, Math.max(0.25, Math.min(8, t.zoom * distance / oldDistance))));
        } else if (event.pointerType !== "touch" || transform.zoom > 1) {
          setTransform(t => ({ ...t, x: t.x + next.x - previous.x, y: t.y + next.y - previous.y }));
        }
      },
      onPointerUp: (event: React.PointerEvent) => { pointers.current.delete(event.pointerId); },
      onPointerCancel: (event: React.PointerEvent) => { pointers.current.delete(event.pointerId); },
      onLostPointerCapture: (event: React.PointerEvent) => { pointers.current.delete(event.pointerId); },
      onDoubleClick: () => zoom("fit"),
      style: { position: "relative", width: "100%", height, minHeight: 100, overflow: "hidden",
        touchAction: transform.zoom > 1 ? "none" : "pan-y", cursor: "grab", userSelect: "none",
        "--pele-bg": theme.colors.surface0, "--pele-fg": palette.text,
        "--pele-muted": palette.text, "--pele-line": palette.line,
        "--pele-surface": palette.node, "--pele-surface-alt": palette.cluster,
        "--pele-border": palette.border, "--pele-accent": theme.colors.accent,
        "--pele-radius": "5px", "--pele-error": theme.colors.statusDanger },
    }, createElement("div", {
      "data-testid": "diagram-content",
      style: { position: "absolute", left: "50%", top: "50%", width: size.width, height: size.height,
        transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${fitted * transform.zoom})`,
        transformOrigin: "center", visibility: ready && !error ? "visible" : "hidden" },
    }, pele ? createElement("div", { ref: host, style: { width: "100%", height: "100%" } })
      : <MermaidSurface source={stableSource} dark={palette.node === "#1f2020"} onRendered={onRendered} onError={onError} />))}
    {!!error && <Text accessibilityRole="alert" selectable style={{ color: theme.colors.statusDanger, fontSize: 12 }}>
      {phase === "streaming" ? "Rendering diagram…" : `Unable to render diagram: ${error}`}
    </Text>}
  </>);
}
