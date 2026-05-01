# Ear Trainer

A small browser-based ear training app for practicing interval and chord recognition. It uses the Web Audio API to synthesize notes directly in the browser, so there are no audio files or build tools required.

## Features

- Interval practice with ascending, descending, or mixed playback
- Chord quality practice
- Beginner, intermediate, and advanced difficulty presets
- Replay button that restarts the current question without overlapping audio
- Immediate feedback with the correct answer and played notes or chord name
- Running score for the current session

## Run Locally

Open `index.html` directly in a browser:

```bash
open index.html
```

You can also double-click `index.html` from Finder.

## Files

- `index.html` contains the app structure.
- `styles.css` contains the responsive layout and visual styling.
- `app.js` contains quiz state, answer generation, and Web Audio playback.

No install step is needed.
