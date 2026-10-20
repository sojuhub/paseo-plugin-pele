import { render } from "pele";
export { mount } from "pele";
export type { Mounted } from "pele";

export const renderOptions = {
    images: false as const,
    links: false as const,
    limit: 50_000,
    outputLimit: 2_000_000,
    maxEdges: 1000,
};

export function renderVector(source: string, maxWidth = 800) {
  return render(source, { ...renderOptions, maxWidth });
}
