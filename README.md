# Pele for Paseo

Renders `mermaid` and `pele` fenced blocks directly inside Paseo chat as live SVG.
Standard Mermaid diagrams use the exact sandboxed Mermaid runtime bundled with
Paseo 0.11.4. Pele-only dialects continue to use Pele 1.7.0. Both run locally,
without generating PNGs or calling a rendering service. Existing chat history
uses the renderer too.

## Install

```sh
paseo plugin add git:sojuhub/paseo-plugin-pele
```

Requires npm on the daemon host. Installation uses the committed dependency lock
and disables dependency lifecycle scripts.

For local development:

```sh
git clone https://github.com/sojuhub/paseo-plugin-pele.git
cd paseo-plugin-pele
npm ci --ignore-scripts
bun run check
paseo plugin install "$PWD"
```

Enable plugins in Paseo's settings first. After source changes use
`paseo plugin reload pele`; no daemon restart is necessary.

Tested with Paseo 0.11.4 on Mac's web client. The desktop app uses the web
rendering path. Native iOS/Android chat is left to Paseo's original renderer.

## Use

Ask an agent to produce a Mermaid diagram, or send one yourself:

````md
```mermaid
flowchart LR
 A[Order received] --> B[Delivered]
```
````

The diagram toolbar matches Paseo 0.11.4's built-in Mermaid controls: icon-only
**Zoom in**, **Zoom out**, **Reset view**, **View source** and **Fullscreen**,
in that order at the top right. Desktop controls appear on hover or keyboard
focus; compact/touch controls stay reachable. The same Lucide icons use 20 px
buttons / 14 px glyphs on desktop and 32 px / 18 px on compact layouts.
Tooltips and accessible names are English; button text and the percentage row
are removed. Source view provides **View diagram** and an icon for **Copy code**.

Fullscreen fills the browser viewport and has zoom/reset/close icons. Escape
closes it. Inline Ctrl/Command-wheel zoom, fullscreen wheel zoom, drag and
keyboard controls remain available; double-click restores the fitted view.
Standard diagrams use Mermaid’s original default/light and dark themes, fonts,
spacing and edge routing. Inline diagrams fit the available width without a
420px height cap; long diagrams retain their vertical space. Reset view restores
both scale and centering, including after a pan. The viewport is plugin-owned;
it is not a copy of every native gesture. Multiple diagrams and surrounding Markdown
are retained, and incomplete streaming input remains recoverable.

The **Pele** sidebar is a paste-and-preview editor. `/pele path/to/file.md`
opens it with the current workspace and path; press **Load**. The workspace
panel and Command Center also expose Pele. Files are read-only, limited to
200 KB and `.md`, `.markdown`, `.mmd`, `.mermaid` paths inside that workspace.
See [example.md](example.md).

## Compatibility and boundaries

- Standard Mermaid syntax is rendered by the pinned Paseo runtime. Pele-only
  agentflow, usecase, railroad, treeView, cynefin, wardley, swimlane, ishikawa and
  eventmodeling diagrams keep Pele’s layout. Their appearance is not promised
  identical to Mermaid. See [vendored runtime provenance](client/vendor/NOTICE.md).
- Paseo 0.11.4 applies the **first matching timeline transformer** to a whole
  message. In the current setup, a response mixing Gen-UI `ui`/`app` blocks and
  diagrams is claimed by Gen-UI; its diagram text is not rendered by Pele.
  Separate those into different messages. Neither plugin is disabled or modified.
- The plugin cannot replace Paseo's built-in Markdown file preview or every
  tool-output widget. Use its file panel for Pele preview.
- Surrounding prose uses a small Markdown renderer. It preserves text, tables,
  lists, safe web/mail links and ordinary code; host-specific file-link actions,
  image previews and advanced Markdown extensions are not replicated.
- The browser-only component is intentionally guarded by `Platform.OS === "web"`.
  It uses a DOM container because SDK 0.11.4 has no arbitrary SVG component.
  Native mobile clients do not run its chat transformers.
- The Mermaid iframe is sandboxed without same-origin access. Its CSP blocks
  network requests and images; links cannot be interacted with. Strict rendering
  and source/edge limits stay enabled. The Pele path disables links and images
  and retains source, output and edge limits. File access
  resolves symlinks and rejects paths outside the workspace. No credentials,
  transcript collection, persistence or background jobs are added.

## Verification

`bun run check` runs TypeScript plus parser, Markdown, file-boundary and actual
Pele rendering tests. The 33 diagram-family fixtures are smoke tests, not an
exhaustive guarantee for every Mermaid construct.

Actual local Paseo browser checks covered two inline assistant diagrams, user
diagrams, zoom/pan/fit, expanded view, source view/copy, invalid-input recovery,
light/dark themes, 390 px layout, slash command and a workspace Markdown file
containing prose, a table and two diagrams.

Real native-mobile rendering, every Mermaid syntax variant, every other
timeline-transforming plugin combination and packaged Electron UI were not
separately tested.

## License

Plugin code is MIT. Rendering uses [Pele](https://pele.run/) and Mermaid; Markdown
parsing uses Marked. The vendored Paseo runtime is Apache-2.0, with embedded
third-party notices retained; see [NOTICE](client/vendor/NOTICE.md).
