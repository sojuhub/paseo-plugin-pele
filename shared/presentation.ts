// Paseo's built-in Mermaid uses the upstream default/dark palette and 16px labels.
export function diagramPalette(background: string) {
  const hex = background.replace(/^#/, "");
  const rgb = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex;
  const dark = /^[\da-f]{6}$/i.test(rgb)
    ? (parseInt(rgb.slice(0, 2), 16) * 0.2126 + parseInt(rgb.slice(2, 4), 16) * 0.7152 + parseInt(rgb.slice(4, 6), 16) * 0.0722) < 128
    : false;
  return dark
    ? { text: "#ccc", line: "#ccc", node: "#1f2020", border: "#ccc", cluster: "#302F3D" }
    : { text: "#333", line: "#333", node: "#ECECFF", border: "#9370DB", cluster: "#ffffde" };
}

export function fitDiagram(size: { width: number; height: number }, width: number, height?: number) {
  if (size.width <= 0 || size.height <= 0 || width <= 0) return 1;
  // Inline diagrams use the transcript's vertical space, not a shrinking height cap.
  return height === undefined ? Math.min(1, width / size.width) : Math.min(width / size.width, height / size.height);
}

export type DiagramSize = { width: number; height: number };
export function validDiagramSize(value: DiagramSize) {
  return Number.isFinite(value.width) && Number.isFinite(value.height) && value.width > 0 && value.height > 0;
}

export function zoomAt(current: { zoom: number; x: number; y: number }, next: number, point = { x: 0, y: 0 }) {
  const ratio = next / current.zoom;
  return { zoom: next, x: point.x - (point.x - current.x) * ratio, y: point.y - (point.y - current.y) * ratio };
}
