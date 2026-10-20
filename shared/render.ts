import { render, detectType } from "pele";

export const renderOptions = {
    fontFamily: '"trebuchet ms", verdana, arial, sans-serif',
    fontSize: 16,
    padding: 16,
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50, padding: 15, curve: "basis" } },
    images: false as const,
    links: false as const,
    limit: 50_000,
    outputLimit: 2_000_000,
    maxEdges: 1000,
};

export function renderVector(source: string, maxWidth = 800) {
  return render(source, { ...renderOptions, maxWidth });
}

const PELE_ONLY = new Set(["agentflow", "usecase", "railroad", "treeView", "cynefin", "wardley", "swimlane", "ishikawa", "eventmodeling"]);

// Keep Pele-only dialects; standard Mermaid uses Paseo's exact bundled renderer.
export function usesPeleEngine(source: string) {
  try { return PELE_ONLY.has(detectType(source) ?? ""); }
  catch { return false; }
}
