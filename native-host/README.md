# Native Pele support — prepared, not installed

Base: getpaseo/paseo dc5b02f7d7c120baea380d76def8b968020d8823 (0.11.4).

The existing plugin exits on non-web platforms; its DOM viewer cannot render natively. This host patch routes `pele` fences through the existing Mermaid preview/fullscreen/source WebView shell, using Pele 1.7.0 as the rendering engine. Mermaid remains Mermaid. Layout and supported syntax depend on each engine; this does not promise every Mermaid feature exists in Pele.

## Apply

On a clean checkout of the pinned revision:

```sh
git apply /path/to/paseo-native-pele.patch
npm ci
npm run build:mermaid-runtime --workspace=@getpaseo/app
```

Then follow the repository's iOS/Android development and signing procedures. A fresh native host build/install is required. The patch deliberately excludes the large generated `runtime/html.gen.ts`; regeneration above is mandatory. The generated runtime is rebuilt from the patched source.

## Verified

- Patch applies cleanly to pristine pinned source (`git apply --check`).
- 20 focused unit tests: actual Markdown fence routing, render state, request driver, source policy.
- Limited strict TypeScript check of render model, driver and bridge. Full app typecheck not run.
- 5 existing/extended browser runtime tests pass in Chromium. QA copies of tested source/runtime files are byte-for-byte identical to checkout; separate fixture avoids requiring Expo for this focused browser test.
- 9 actual iOS simulator WKWebView checks pass: Mermaid baseline, Korean Pele flowchart/mindmap, sequence, invalid input/recovery, switching engines, disabled links and interactive viewport configuration. See ios-runtime-result.json and ios-pele-mindmap.png.
- REA static shipped-artifact analysis executed; partial coverage because one large JS bundle exceeded the bounded 256MB heap. Source review and runtime tests supply separate evidence.

## Not verified / not deployed

The simulator harness runs the exact generated diagram runtime, not the full Paseo React Native app. Fullscreen navigation, gestures and source toggle reuse existing app components but were not exercised end-to-end. No physical iPhone install, Android runtime test, complete app build, or official release occurred. Existing plugin, installed app bundle and daemon were not modified or restarted.

