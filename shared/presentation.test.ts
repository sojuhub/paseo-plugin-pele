import { expect, test } from "bun:test";
import { diagramPalette } from "./presentation";

test("Mermaid default and dark palettes follow the host background", () => {
  expect(diagramPalette("#ffffff").node).toBe("#ECECFF");
  expect(diagramPalette("#181B1A").border).toBe("#ccc");
  expect(diagramPalette("#fff")).toEqual(diagramPalette("#ffffff"));
});
