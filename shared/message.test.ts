import { expect, test } from "bun:test";
import { segmentMessage, splitMessage } from "./message";

test("splits mermaid and pele fences while preserving text and whitespace", () => {
  const input = "before\n~~~mermaid\nflowchart LR\n A-->B\n~~~\nafter\n```pele\nsequenceDiagram\n A->>B: hi\n```\nend";
  expect(segmentMessage(input)).toEqual([
    { kind: "text", text: "before\n" },
    { kind: "mermaid", source: "flowchart LR\n A-->B", complete: true },
    { kind: "text", text: "\nafter\n" },
    { kind: "mermaid", source: "sequenceDiagram\n A->>B: hi", complete: true },
    { kind: "text", text: "\nend" },
  ]);
});

test("keeps ordinary code fences and nested longer fences inside source", () => {
  const input = "```js\nkeep\n```\n````mermaid\nflowchart LR\n```js\ninside\n```\n````\n";
  const parts = segmentMessage(input);
  expect(parts[0]).toEqual({ kind: "text", text: "```js\nkeep\n```\n" });
  expect(parts[1]).toEqual({ kind: "mermaid", source: "flowchart LR\n```js\ninside\n```", complete: true });
  expect(parts[2]).toEqual({ kind: "text", text: "\n" });
});

test("keeps an unclosed streaming diagram and avoids transforming plain text", () => {
  expect(segmentMessage("```mermaid\nflowchart LR\nA-->B").at(-1)).toEqual({ kind: "mermaid", source: "flowchart LR\nA-->B", complete: false });
  expect(splitMessage("ordinary prose", "complete")).toBeUndefined();
  expect(splitMessage("```mermaid\nx\n```", "complete")?.items[0]?.data).toEqual({ source: "x", phase: "complete" });
});


test("recognizes an empty fenced diagram", () => {
  expect(segmentMessage("```mermaid\n```\n")).toEqual([
    { kind: "mermaid", source: "", complete: true },
    { kind: "text", text: "\n" },
  ]);
});

test("a finalized unclosed diagram receives complete timeline phase", () => {
  expect(splitMessage("```mermaid\nflowchart LR", "complete")?.items[0]?.data).toEqual({ source: "flowchart LR", phase: "complete" });
});

test("host assigns source-scoped IDs so separate messages cannot collide", () => {
  const result = splitMessage("```mermaid\nflowchart LR\nA-->B\n```", "complete");
  expect(result?.items.every((item) => item.id === undefined)).toBe(true);
});

test("Windows CRLF fences close while surrounding prose is preserved", () => {
  expect(segmentMessage("앞\r\n```mermaid\r\nflowchart LR\r\nA-->B\r\n```\r\n뒤")).toEqual([
    { kind: "text", text: "앞\r\n" },
    { kind: "mermaid", source: "flowchart LR\r\nA-->B", complete: true },
    { kind: "text", text: "\r\n뒤" },
  ]);
});
