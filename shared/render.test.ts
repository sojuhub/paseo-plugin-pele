import { expect, test } from "bun:test";
import { renderVector } from "./render";

const supportedDiagrams: Array<[string, string]> = [
  ["flowchart", "flowchart LR\n A[주문] --> B[배송]"],
  ["sequence", "sequenceDiagram\n participant 고객\n participant 상점\n 고객->>상점: 주문"],
  ["class", "classDiagram\n class Order\n class Customer\n Customer --> Order"],
  ["state", "stateDiagram-v2\n [*] --> 대기\n 대기 --> 완료"],
  ["entity relationship", "erDiagram\n CUSTOMER ||--o{ ORDER : places"],
  ["gantt", "gantt\n title 배송 일정\n dateFormat YYYY-MM-DD\n section 주문\n 접수 :a1, 2026-01-01, 1d"],
  ["git graph", "gitGraph\n commit\n branch feature\n checkout feature\n commit\n checkout main\n merge feature"],
  ["pie", 'pie title 주문 분류\n "신선" : 3\n "냉동" : 2'],
  ["mindmap", "mindmap\n root((주문))\n  접수\n  배송"],
  ["kanban", "kanban\n  todo[할 일]\n    task1[주문 확인]"],
  ["timeline", "timeline\n title 주문 과정\n 주문 접수\n : 결제 완료"],
  ["user journey", "journey\n title 고객 여정\n section 구매\n  주문: 5: 고객"],
  ["quadrant chart", "quadrantChart\n x-axis 낮음 --> 높음\n y-axis 낮음 --> 높음\n 주문: [0.7, 0.8]"],
  ["XY chart", "xychart-beta\n x-axis [1, 2]\n y-axis 0 --> 10\n bar [3, 7]"],
  ["requirement", 'requirementDiagram\nrequirement "주문확인" {\n    id: 1\n    text: "주문 확인"\n    risk: high\n    verifymethod: test\n}'],
  ["sankey", "sankey\nBio-conversion,Losses,26.862\nBio-conversion,Solid,280.322"],
  ["architecture", "architecture-beta\n service api(internet)[API]\n service db(database)[DB]\n api:R --> L:db"],
  ["C4", 'C4Context\n Person(customer, "고객", "주문자")\n System(store, "상점", "주문 처리")\n Rel(customer, store, "주문")'],
  ["block", "block\n  a b c"],
  ["agentflow", 'agentflow-beta TB\n  a["A"] --> b["B"]'],
  ["railroad", 'railroad-ebnf-beta\nsign = "+" | "-" ;'],
  ["swimlane", "swimlane-beta\n  subgraph Sales\n    lead[Qualify lead]\n    quote[Prepare quote]\n  end"],
  ["tree view", "treeView-beta\n root[주문]\n  접수\n  배송"],
  ["treemap", 'treemap-beta\n"Category A"\n    "Item A1": 10\n    "Item A2": 20\n"Category B"\n    "Item B1": 15'],
  ["use case", 'usecase-beta\nactor User\nLogin\nUser -- "include account details" --> Login'],
  ["Venn", 'venn-beta\n  set A["Alpha"]\n  set B["Beta"]\n  union A,B["AB"]'],
  ["Wardley map", "wardley-beta\ntitle Custom Size\nsize [800, 1000]"],
  ["event modeling", "eventmodeling\n\ntf 01 ui CartUI\ntf 02 cmd AddItem\ntf 03 evt ItemAdded"],
  ["Ishikawa", "ishikawa-beta\n    Blurry Photo\n    Process\n        Out of focus\n        Shutter speed too slow\n        Protective film not removed\n        Beautification filter applied\n    User\n        Shaky hands"],
  ["packet", 'packet\ntitle UDP Packet\n+16: "Source Port"\n+16: "Destination Port"\n32-47: "Length"'],
  ["radar", '---\ntitle: "Grades"\n---\nradar-beta\n  axis m["Math"], s["Science"], e["English"]\n  curve a["Alice"]{85, 90, 80, 70, 75, 90}\n  max 100\n  min 0'],
  ["Cynefin", "cynefin-beta\n  title Cynefin Framework\n\n  complex\n  complicated\n  clear\n  chaotic"],
  ["info", "info\n"],
];

test.each(supportedDiagrams)("Pele renders the %s family as vector output", (_family, source) => {
  const result = renderVector(source);
  expect(result.svg).toContain("<svg");
  expect(result.svg).not.toContain("<image");
  expect(result.svg).not.toContain("data:image");
  expect(result.width).toBeGreaterThan(0);
  expect(result.height).toBeGreaterThan(0);
});

test("Pele produces an inline SVG with Korean labels, not a raster image", () => {
  const result = renderVector("flowchart LR\n A[주문 접수] --> B[배송 완료]");
  expect(result.svg).toContain("주문 접수");
  expect(result.svg).toContain("배송 완료");
});

test("untrusted labels and click directives never become executable SVG", () => {
  const result = renderVector('flowchart LR\n A["<script>alert(1)</script>"] --> B[Done]\n click B "javascript:alert(1)"');
  expect(result.svg).not.toContain("<script");
  expect(result.svg).not.toMatch(/(?:href|onload|onclick)=/);
});

test("source length over the configured limit is rejected", () => {
  expect(() => renderVector("flowchart LR\n" + "%% Korean fixture\n".repeat(3_000))).toThrow();
});

test("flowchart edge count over the configured limit is rejected", () => {
  const edges = Array.from({ length: 1_001 }, (_, index) => `N${index} --> N${index + 1}`).join("\n");
  expect(() => renderVector(`flowchart LR\n${edges}`)).toThrow();
});

test("invalid source is reported instead of a misleading diagram", () => {
  expect(() => renderVector("not a diagram")).toThrow();
});
