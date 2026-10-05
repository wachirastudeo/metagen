# Verification — 2026-10-02

## Design and rendering

Concept: `docs/ui-concept.png`. Browser rendering: `docs/ui-render.png`, captured using Codex In-app Browser at 420 × 850 (full-page image includes vertical scroll content). Both images inspected through view_image. Also checked 320 × 850 and the concept image dimensions 883 × 1782; no horizontal overflow. A narrow max-width remains on desktop because the deliverable is an extension panel.

Comparison ledger:

| Point | Concept | Implementation / decision |
| --- | --- | --- |
| Palette | Navy background, muted blue surfaces, mint action | CSS tokens use #10141e, #191f2d, #9ce5c4 |
| Typography | Sans-serif, prominent title, readable form labels | Tahoma / Segoe UI, explicit label and control sizes; Thai text verified in browser |
| Layout | Single narrow column with paired orientation / counts | Preserved single-column forms and paired controls; vertical scrolling supports extra required options |
| Orientation | Selected portrait with mint border | 9:16 selected state and selectable 16:9; no horizontal overflow at 320 px |
| Copy | Setup, synopsis, genre, characters, language, create prompt | Same primary settings; deliberate additional sound, extra instructions, estimate, connection and project IO controls |
| Header / tabs | Wordmark, full mint active tab, inline connection | Deliberate implementation variation: compact S mark, underline tabs and separate actionable connection row |
| Media | No illustrative assets | All UI code-native; generated image retained as design reference only |

The concept's general palette, narrow form structure and control families were checked against the implementation; it is not an exact copy of the generated mockup. Above-fold differences are the explicit header/connection/tab variations and functional preview-state text. No user reference brand or model picker copied.

## Functional verification

- In-app browser: fill series name / synopsis / characters; create 6 scenes; edit first scene; rebuild prompt; mark complete; move to second scene; reload confirms persistence.
- UI console: no errors observed.
- Node syntax checks: all JavaScript files pass.
- `node tests/core.test.cjs`: prompt settings, per-episode numbering, unique identifiers, bounds, JSON round-trip, malformed imports pass.
- `node tests/bridge.test.cjs`: simulated DOM checks for send, fill-only, occupied composer, ambiguous composer and missing-button fallback pass.

## Initial verification limitations (superseded by live checks below)

Real unpacked installation in user Chrome, real logged-in Meta AI input editor and generation button, Meta server acceptance and video result. Available browser is Codex IAB; no accessible user Chrome session was present. No generation was requested from Meta AI in testing. No automated video collection or queue continuation is shipped.

0.3.2: core/plot/cast/bridge/plot-options tests passed. Local browser preview verified JSON options rendered, second option prepares matching title in expansion request, and options survive reload. Fixture outlines used; no live AI response claimed.

2026-10-02 live Meta AI: extension filled the prompt but initial strict newline comparison stopped submission. Fixed newline-only normalization; reloaded extension and Meta page, then extension Send submitted successfully without manual send. Meta AI returned five plots; response read via Windows accessibility and entered into panel, parsed and persisted as five selectable cards. Live evidence: meta-live-plots.json and meta-live-plots.png. Automatic answer retrieval is still not implemented.

2026-10-02, version 0.4.0, live Chrome with logged-in Meta AI:
- Character prompt sent from extension on `/create`; Meta navigated to `/prompt/ec05e1ad-eef4-40de-9da8-ac412325d515` and generated two 1152 × 2048 images of fictitious แม่หญิงลำดวน.
- Initial broad extraction mistakenly included search illustrations while Meta was thinking. Corrected chat extraction to generated `img[data-testid="ur-image-tile"]`, reloaded extension and page, and read exactly the two generated images. Both rendered in the panel; first selected and saved to the character asset.
- Location prompt sent from extension on `/create`; Meta navigated to `/prompt/7d634131-a761-45fd-a657-23024b267f68`, generated เรือนไทยริมน้ำ, and automatic polling detected and rendered that new image. Selected and saved to location asset.
- `/create` then showed three generated works. The panel's Read images returned all three and excluded the eight preset cards above the works heading. Evidence: `meta-live-images.png`.
- Character name/details and image survived extension reload before location testing. Metadata uses Chrome local storage; image binaries are not permanently saved and signed CDN links can expire. No image-to-video reference upload was tested or implemented.
- Asset and media extraction tests passed, including legacy project import, host checks, preset/search exclusion, hidden images and deduplication. All seven Node test files passed.


0.6.0 UI: dark ink/gold theme, SVG brand mark and PNG Chrome icons (16/32/48/128). Rendered local preview at 400 px and 320 px: no horizontal overflow, logo loaded, no console errors. Screenshot: ui-studio-060.png. Chrome toolbar icon appearance after reload not checked in this turn.

2026-10-04 live Chrome 0.6.2: clicked Connect on logged-in Meta AI home; panel showed ready and successful inline feedback. Opened a disposable Example Domain tab, activated it and clicked Connect again; extension activated the existing Meta AI tab and reported ready. Evidence: connect-live-20261004.png. New-tab creation when no Meta tab exists remains covered by background-connect.test.cjs; user Meta tab was retained.

2026-10-04 live five-episode microseries test, maximized Chrome:
- Meta returned five plot choices. Imported them through the panel and selected สัญญาบัวริมเรือน. Meta returned a five-episode story, six cast members and three locations; imported through the panel.
- Generated five actual videos using ScenePilot's scene Send button. Downloaded EP01–EP05 through Meta's Download UI; ffprobe confirmed every file is 720×1280 H.264 with AAC audio and exactly 10 seconds. Full combined-file decoding passed; concatenated result is 50.042667 seconds.
- Episode 3's letter scene failed twice. Replaced it with Meta's suggested mother's silk scene, used a concise English prompt in a fresh Create conversation, and generated the actual third video. Other four episodes share the original conversation. Face/costume identity across all clips is not established by reference images.
- Downloaded the panel's exported project and confirmed all five scenes are marked done only after file verification. Files and screenshot are in results/series-5-20261004; archive is results/ScenePilot-series-5-episodes.zip.
- Importing answers, downloading clips, recording results and marking scenes done remain manual. This round did not generate the nine cast/location reference images or test image-to-video uploads. One initial plot-send needed a manual Meta Send click; subsequent plot expansion and all video submissions went through the extension.
- Fixed parsePlot compiling scene prompts before location data and using a generic characters summary instead of detailed cast. New regression checks verify both cast and location details reach every compiled prompt. All ten Node test files passed. Source/package version 0.6.3; live workflow ran the installed 0.6.2 with prompts edited through its UI, so installation of 0.6.3 has not been verified in this round.
