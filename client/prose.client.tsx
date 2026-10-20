import type { PluginTheme } from "@getpaseo/plugin";
import { openExternalUrl } from "@getpaseo/plugin/client";
import { copyText, ScrollView, useToast } from "@getpaseo/plugin/client/react-native";
import { createElement, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type { Token, Tokens } from "marked";
import { parseMarkdown, safeLinkHref } from "../shared/markdown";

type Props = { text: string; theme: PluginTheme; compact?: boolean };

export function Prose({ text, theme, compact = false }: Props) {
  const toast = useToast();
  const runAction = async (action: () => Promise<void>, success?: string) => {
    try { await action(); if (success) toast.show(success, { variant: "success" }); }
    catch (error) { toast.error(error instanceof Error ? error.message : String(error)); }
  };
  const base = { color: theme.colors.foreground, fontSize: compact ? 13 : 15, lineHeight: compact ? 20 : 23 } as const;
  const inline = (tokens: Token[] = [], key = "i"): ReactNode[] => tokens.map((token, index) => render(token, `${key}-${index}`, true));
  const render = (token: Token, key: string, isInline = false): ReactNode => {
    const children = "tokens" in token && Array.isArray(token.tokens) ? inline(token.tokens, key) : undefined;
    switch (token.type) {
      case "text": case "escape": case "codespan": return createElement(Text, { key, style: token.type === "codespan" ? { ...base, fontFamily: "monospace", backgroundColor: theme.colors.surface1 } : base }, children ?? token.text);
      case "strong": return createElement(Text, { key, style: { fontWeight: "700", color: theme.colors.foreground } }, children);
      case "em": return createElement(Text, { key, style: { fontStyle: "italic", color: theme.colors.foreground } }, children);
      case "del": return createElement(Text, { key, style: { textDecorationLine: "line-through", color: theme.colors.foreground } }, children);
      case "link": {
        const href = safeLinkHref(token.href);
        return href ? createElement(Text, { key, accessibilityRole: "link", onPress: () => void runAction(() => openExternalUrl(href)), style: { ...base, color: theme.colors.accent, textDecorationLine: "underline" } }, children) : createElement(Text, { key, style: base }, children);
      }
      case "br": return createElement(Text, { key }, "\n");
      case "space": return null;
      case "html": return createElement(Text, { key, style: base }, token.text);
      case "heading": return createElement(Text, { key, style: { ...base, fontSize: (compact ? 17 : 20) - Math.min(token.depth - 1, 4), fontWeight: "700", marginTop: 10, marginBottom: 4 } }, children);
      case "paragraph": return createElement(Text, { key, style: { ...base, marginBottom: compact ? 6 : 10 } }, children);
      case "code": return createElement(View, { key, style: { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border, borderWidth: 1, padding: 10, marginVertical: 6 } },
        createElement(Pressable, { accessibilityRole: "button", accessibilityLabel: "Copy code", onPress: () => void runAction(() => copyText(token.text), "Copied") }, createElement(Text, { style: { color: theme.colors.accent, textAlign: "right" } }, "Copy")),
        createElement(Text, { selectable: true, style: { ...base, fontFamily: "monospace" } }, token.text));
      case "blockquote": return createElement(View, { key, style: { borderLeftWidth: 3, borderLeftColor: theme.colors.border, paddingLeft: 10, marginVertical: 6 } }, ...(token.tokens ?? []).map((item, i) => render(item, `${key}-${i}`)));
      case "list": {
        const list = token as Tokens.List;
        return createElement(View, { key, style: { marginVertical: 4, paddingLeft: list.ordered ? 18 : 8 } }, ...list.items.map((item: Tokens.ListItem, i: number) => createElement(View, { key: `${key}-${i}`, style: { flexDirection: "row", gap: 6, marginBottom: 3 } }, createElement(Text, { style: base }, item.task ? (item.checked ? "☑" : "☐") : list.ordered ? `${Number(list.start ?? 1) + i}.` : "•"), createElement(View, { style: { flex: 1 } }, ...(item.tokens ?? []).map((part: Token, j: number) => render(part, `${key}-${i}-${j}`))))));
      }
      case "table": {
        const table = token as Tokens.Table;
        const rows: Tokens.TableCell[][] = [table.header, ...table.rows];
        return createElement(ScrollView, { key, horizontal: true, style: { marginVertical: 6 } }, createElement(View, { style: { borderColor: theme.colors.border, borderWidth: 1 } }, ...rows.map((row: Tokens.TableCell[], rowIndex: number) => createElement(View, { key: `${key}-r${rowIndex}`, style: { flexDirection: "row", backgroundColor: rowIndex === 0 ? theme.colors.surface1 : theme.colors.surface0 } }, ...row.map((cell: Tokens.TableCell, cellIndex: number) => createElement(View, { key: `${key}-${rowIndex}-${cellIndex}`, style: { width: 120, padding: 7, borderRightColor: theme.colors.border, borderRightWidth: 1 } }, createElement(Text, { style: { ...base, fontWeight: rowIndex === 0 ? "700" : "400", textAlign: cell.align ?? "left" } }, inline(cell.tokens, `${key}-${rowIndex}-${cellIndex}`))))))));
      }
      case "hr": return createElement(View, { key, style: { borderBottomColor: theme.colors.border, borderBottomWidth: 1, marginVertical: 8 } });
      default: {
        const fallback = "text" in token && typeof token.text === "string" ? token.text : "raw" in token && typeof token.raw === "string" ? token.raw : "";
        return fallback ? createElement(Text, { key, style: base }, fallback) : children ? createElement(Text, { key, style: base }, children) : null;
      }
    }
  };
  return createElement(View, { style: { gap: compact ? 2 : 4, minWidth: 0 } }, ...parseMarkdown(text).map((token, index) => render(token, `block-${index}`, false)));
}
