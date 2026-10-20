import { expect, test } from "bun:test";
import { mermaidRuntimeHtml } from "../client/vendor/mermaid-runtime";

test("vendored runtime keeps upstream isolation, strict rendering and no network", () => {
  expect(mermaidRuntimeHtml).toContain("default-src 'none'");
  expect(mermaidRuntimeHtml).toContain("connect-src 'none'");
  expect(mermaidRuntimeHtml).toContain("frame-src 'none'");
  expect(mermaidRuntimeHtml).toContain('securityLevel:"strict"');
  expect(mermaidRuntimeHtml.replace("img-src data: blob:", "img-src 'none'")).toContain("img-src 'none'");
});
