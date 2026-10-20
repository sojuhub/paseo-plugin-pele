# Paseo viewport attribution

client/viewport.client.tsx, client/viewport-types.ts and shared/viewport-geometry.ts
are adapted from Paseo's actual Mermaid ZoomableViewport at commit
dc5b02f7d7c120baea380d76def8b968020d8823:
https://github.com/getpaseo/paseo/tree/dc5b02f7d7c120baea380d76def8b968020d8823/packages/app/src/components/zoomable-viewport

Copyright 2025-present Mohamed Boudra. Apache-2.0, see PASEO-LICENSE.
Adaptations replace app-specific theme/icon imports with the plugin SDK.
Pele renders all diagrams; no Mermaid iframe or runtime is bundled.
