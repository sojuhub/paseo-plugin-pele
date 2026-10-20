import { expect, test } from "bun:test";
import { diagramPalette, fitDiagram } from "./presentation";

test("long inline diagrams retain readable scale instead of shrinking to 420px", () => {
  expect(fitDiagram({ width: 400, height: 1600 }, 800)).toBe(1);
  expect(fitDiagram({ width: 800, height: 1600 }, 400)).toBe(0.5);
});
test("fullscreen fits both dimensions and can enlarge small diagrams", () => {
  expect(fitDiagram({ width: 400, height: 1600 }, 800, 800)).toBe(0.5);
  expect(fitDiagram({ width: 200, height: 100 }, 800, 600)).toBe(4);
});
test("hidden views do not produce invalid scale", () => {
  expect(fitDiagram({ width: 400, height: 1600 }, 0)).toBe(1);
});
test("Mermaid default and dark palettes follow the host background", () => {
  expect(diagramPalette("#ffffff").node).toBe("#ECECFF");
  expect(diagramPalette("#181B1A").border).toBe("#ccc");
  expect(diagramPalette("#fff")).toEqual(diagramPalette("#ffffff"));
});

test("zoom preserves the chosen point and does not discard a pan", async () => {
  const { zoomAt, validDiagramSize } = await import("./presentation");
  expect(zoomAt({ zoom: 1, x: 20, y: -10 }, 2, { x: 100, y: 50 })).toEqual({ zoom: 2, x: -60, y: -70 });
  expect(validDiagramSize({ width: Infinity, height: 1 })).toBe(false);
  expect(validDiagramSize({ width: -1, height: 5 })).toBe(false);
  expect(validDiagramSize({ width: 200, height: 800 })).toBe(true);
});
