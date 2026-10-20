import { expect, test } from "bun:test";
import { parseMarkdown, safeLinkHref, tokenText } from "./markdown";

test("lexer preserves headings, nested lists, task markers, tables, and inline formatting", () => {
  const tokens = parseMarkdown("# Title\n\n- [x] **done**\n  - nested *item* ~~old~~\n\n| A | B |\n| - | - |\n| 1 | 2 |");
  expect(tokens[0]?.type).toBe("heading");
  expect(tokens.some((token) => token.type === "list" && token.items.some((item: { task: boolean }) => item.task))).toBe(true);
  expect(tokens.some((token) => token.type === "table")).toBe(true);
});

test("recognizes only safe absolute web and mail links", () => {
  const token = parseMarkdown("[web](https://example.com) [mail](mailto:a@example.com) [bad](javascript:alert(1))");
  const links = token.flatMap((block) => block.type === "paragraph" ? (block.tokens ?? []).filter((part) => part.type === "link") : []);
  expect(safeLinkHref((links[0] as { href: string }).href)).toBe("https://example.com");
  expect(safeLinkHref((links[1] as { href: string }).href)).toBe("mailto:a@example.com");
  expect(safeLinkHref((links[2] as { href: string }).href)).toBeUndefined();
});

test("raw hostile HTML remains a token and never becomes trusted markup", () => {
  const tokens = parseMarkdown("&lt;script&gt;alert(1)&lt;/script&gt;\n\n<script>alert(1)</script>");
  expect(tokens.some((token) => token.type === "html")).toBe(true);
  expect(tokens.map(tokenText).join(" ")).toContain("&lt;script&gt;");
});
