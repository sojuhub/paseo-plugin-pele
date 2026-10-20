import { createElement, useCallback, useEffect, useRef } from "react";
import { mermaidRuntimeHtml } from "./vendor/mermaid-runtime";
import { validDiagramSize, type DiagramSize } from "../shared/presentation";

const html = mermaidRuntimeHtml.replace("img-src data: blob:", "img-src 'none'");

export function MermaidSurface({ source, dark, onRendered, onError }: {
  source: string; dark: boolean; onRendered(size: DiagramSize): void; onError(message: string): void;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const revision = useRef(0);
  const send = useCallback(() => {
    if (source.length > 50_000) { onError("Diagram source exceeds 50,000 characters."); return; }
    iframe.current?.contentWindow?.postMessage({
      type: "render", revision: ++revision.current, source,
      colorScheme: dark ? "dark" : "light", interactive: false,
    }, "*");
  }, [source, dark, onError]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "bridgeReady") { send(); return; }
      if (data.revision !== revision.current) return;
      if (data.type === "renderError") onError("Invalid or unsupported Mermaid syntax.");
      if (data.type === "rendered" && data.source === source && validDiagramSize(data)) onRendered(data);
    };
    window.addEventListener("message", receive);
    send();
    return () => window.removeEventListener("message", receive);
  }, [send, source, onRendered, onError]);
  return createElement("iframe", {
    ref: iframe, title: "Mermaid diagram", sandbox: "allow-scripts", srcDoc: html,
    tabIndex: -1, inert: true, "data-testid": "mermaid-runtime",
    style: { display: "block", width: "100%", height: "100%", border: 0, pointerEvents: "none", background: "transparent" },
  });
}
