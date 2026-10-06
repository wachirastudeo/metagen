# ScenePilot 0.7.0 QA

- Chrome, local HTTP preview, isolated from extension user data.
- 13 test files passed: `node --test tests/*.test.cjs`.
- Five synthetic episodes, six 1.5-second MP4 clips with alternating red/blue frames and 440/880 Hz audio.
- Episode 1 exported to WebM: 3 seconds, VP8 1280×720 and Opus.
- Complete series exported: 9 seconds, VP8 1280×720 and Opus.
- Decoded output with ffmpeg and sampled all six clips: colors and audio tones match scene order.
- Reload retained all six files; missing-file buttons were disabled before completion.
- Two-scene episode played through to “เล่นครบแล้ว”.
- Cancelled export restored controls and preserved clips.
- Browser console had no errors/warnings.
- Screenshot: studio-qa.jpg.

Known container warning from ffprobe/ffmpeg: `Unknown-sized element at 0x6af1 inside parent with finite size`. Decode completed successfully; Chrome playback and export work. WebM duration patch uses MIT fix-webm-duration 1.0.6. External player compatibility beyond this verification is untested.

This is media pipeline QA, not evidence that Meta AI generated a five-episode series or preserved character faces across clips. Portrait attachment and downloading generated clips remain manual.

## 0.7.1 verification

The earlier container warning above is resolved. A raw Chrome recording reproduced the difference: raw output decoded cleanly; the old duration library introduced the warning. The new header-only patch preserves every cluster byte and TimestampScale. Real browser exports (episode 3 seconds and series 9 seconds) both decode with ffmpeg and ffprobe without stderr. Playback races and failed audio/recorder setup have regression tests. No browser console errors.

Specifications consulted: https://www.rfc-editor.org/rfc/rfc8794.html and https://www.matroska.org/technical/elements.html .
