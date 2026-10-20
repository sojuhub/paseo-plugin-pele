# Vendored Mermaid runtime

`mermaid-runtime.ts` is the unmodified generated browser runtime from Paseo commit
`dc5b02f7d7c120baea380d76def8b968020d8823`, file
`packages/app/src/components/markdown/fence/mermaid/runtime/html.gen.ts`.
Source: https://github.com/getpaseo/paseo/tree/dc5b02f7d7c120baea380d76def8b968020d8823/packages/app/src/components/markdown/fence/mermaid

Paseo copyright 2025-present Mohamed Boudra; Apache-2.0, see PASEO-LICENSE.
The runtime includes Mermaid and its third-party components; their original
license notices are retained in the generated bundle. The plugin adds a stricter
image CSP when embedding it, but does not change Mermaid's rendering code.

This pinned runtime is bundled locally to match Paseo 0.11.4's actual defaults
without maintaining a second imitation of its layout algorithm. Refresh from the
upstream build and repeat browser verification when updating Paseo compatibility.
