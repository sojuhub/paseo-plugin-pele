import type { PluginTheme } from "@getpaseo/plugin";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { createElement } from "react";
import { Pressable } from "react-native";
import type { ZoomableViewportAction } from "./viewport-types";

export function IconButton({ label, icon, disabled, onPress, theme, compact }: {
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

export function ViewportToolbar({ actions, maxScale, minScale, onReset, onZoomIn, onZoomOut, scale, visible, theme, compact }: {
  actions: ZoomableViewportAction[]; maxScale: number; minScale: number; onReset(): void;
  onZoomIn(): void; onZoomOut(): void; scale: number; visible: boolean; theme: PluginTheme; compact: boolean;
}) {
  const buttons = [
    { icon: "ZoomIn", label: "Zoom in", onPress: onZoomIn, disabled: scale >= maxScale },
    { icon: "ZoomOut", label: "Zoom out", onPress: onZoomOut, disabled: scale <= minScale },
    { icon: "Scan", label: "Reset view", onPress: onReset, disabled: scale === 1 },
    ...actions.map(action => ({ ...action, disabled: false })),
  ];
  return <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4,
    opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}>
    {buttons.map(button => <IconButton key={button.label} {...button} theme={theme} compact={compact} />)}
  </div>;
}
