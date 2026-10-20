import { render } from "pele";

export const renderOptions = {
    fontFamily: '"trebuchet ms", verdana, arial, sans-serif',
    fontSize: 16,
    padding: 8,
    responsive: false,
    autoDirection: false,
    config: { flowchart: { nodeSpacing: 50, rankSpacing: 50, padding: 15, curve: "basis" } },
    images: false as const,
    links: false as const,
    limit: 50_000,
    outputLimit: 2_000_000,
    maxEdges: 1000,
};

export function renderVector(source: string) {
  return render(source, renderOptions);
}
