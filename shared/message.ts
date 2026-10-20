import type { PluginTimelineItem } from "@getpaseo/plugin";

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "mermaid"; source: string; complete: boolean };

export function segmentMessage(text: string): Segment[] {
  const segments: Segment[] = [];
  const opening = /(^|\n)([ \t]*)(`{3,}|~{3,})([^\n]*)(?:\n|$)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = opening.exec(text))) {
    const [, prefix, , marker, info] = match;
    const start = match.index + prefix.length;
    const bodyStart = opening.lastIndex;
    const close = new RegExp(`(?:^|\\n)[ \\t]*${marker[0]}{${marker.length},}[ \\t]*(?=\\r?\\n|$)`, "g");
    close.lastIndex = Math.max(0, bodyStart - 1);
    const closing = close.exec(text);
    const language = info.trim().split(/[ \t]+/, 1)[0]?.toLowerCase();
    const target = language === "mermaid" || language === "pele";
    if (!closing) {
      if (target) {
        if (start > cursor) segments.push({ kind: "text", text: text.slice(cursor, start) });
        segments.push({ kind: "mermaid", source: text.slice(bodyStart).replace(/^\r?\n/, "").replace(/\r?\n$/, ""), complete: false });
        cursor = text.length;
      }
      break;
    }
    const fullEnd = close.lastIndex;
    if (target) {
      if (start > cursor) segments.push({ kind: "text", text: text.slice(cursor, start) });
      const closingStart = closing.index + (text[closing.index] === "\n" ? 1 : 0);
      segments.push({ kind: "mermaid", source: text.slice(bodyStart, closingStart).replace(/^\r?\n/, "").replace(/\r?\n$/, ""), complete: true });
      cursor = fullEnd;
    }
    opening.lastIndex = fullEnd;
  }
  if (cursor < text.length) segments.push({ kind: "text", text: text.slice(cursor) });
  return segments.length ? segments : [{ kind: "text", text }];
}

export function splitMessage(text: string, phase: "streaming" | "complete"): { items: PluginTimelineItem[] } | undefined {
  const segments = segmentMessage(text);
  if (!segments.some((segment) => segment.kind === "mermaid")) return undefined;
  const items: PluginTimelineItem[] = [];
  segments.forEach((segment) => {
    if (segment.kind === "mermaid") {
      const diagramPhase: "streaming" | "complete" = phase === "complete" || segment.complete ? "complete" : "streaming";
      items.push({ type: "plugin", kind: "pele-diagram", version: 1, data: { source: segment.source, phase: diagramPhase } });
    } else items.push({ type: "plugin", kind: "pele-text", version: 1, data: { text: segment.text } });
  });
  return { items };
}
