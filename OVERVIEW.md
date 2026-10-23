Pele renders Mermaid and Pele code blocks as interactive SVG directly inside Paseo chat. Zoom, drag, fit, expand, inspect and copy the original source without creating a raster image. A sidebar and workspace panel also preview pasted code or workspace Markdown files.

Requires Paseo 0.11.4 or later with plugins enabled and a desktop/web client. Native mobile chat keeps the original renderer; installing this plugin does not enable native Pele diagrams. The repository includes an optional app-source patch that requires a separate native app build and installation. No account or rendering service is required. Diagram image loading and link actions are disabled; optional file reads stay within the selected workspace and are limited to 200 KB.

Pele has its own Mermaid syntax coverage and layout. Paseo's built-in file preview and tool-output widgets are not replaced. Paseo gives an entire message to the first matching timeline plugin, so Gen-UI blocks and Pele diagrams in one response currently require separate messages. Surrounding prose supports standard text, tables, lists and code, without all host-specific Markdown actions.

The daemon needs npm for installation. Locked dependencies are installed from the npm registry with lifecycle scripts disabled. Rendering runs in the client without a rendering service. The plugin does not send additional prompts or tool results to agent providers; normal Paseo conversations retain their configured provider behavior.

Every diagram uses Pele. Its viewport is adapted directly from Paseo 0.11.4’s
Mermaid viewer, including centered sizing, bounded pan, hover controls and fullscreen.
Pele has its own graph layout; exact Mermaid SVG geometry is not claimed.
Long diagrams retain their natural height, without a fixed-height preview or an iframe.
