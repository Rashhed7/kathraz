# Homepage cover video

Drop your cover video here as:

```
public/videos/hero-cover.mp4
```

Requirements for the hero to look right:

- **Name it exactly** `hero-cover.mp4` (lowercase, no spaces).
- **Mute the audio track** before uploading (browsers block autoplay for videos with sound).
- **16:9 or wider** works best; the video is cropped to fill (`object-fit: cover`).
- Keep it short (8–20 s) and under ~8 MB so mobile loads stay fast.
- H.264 MP4 is the safest format for all browsers.

The hero section in `src/pages/Home.jsx` reads `/videos/hero-cover.mp4`.
While the file is missing, the hero falls back to a plain brand gradient.
