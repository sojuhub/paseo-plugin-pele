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
