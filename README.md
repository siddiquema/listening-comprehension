# Listen & Type (enaasan beta)

A free practice tool for three basic workplace skills: **typing**, **listening across English accents**, and **capturing the key facts** from what you hear or read. Built for service desk and support staff, and for students preparing for college, interviews and first jobs.

Status: **private beta, not linked from enaasan.online.** Testers get free access.

## Exercises

| Level | Exercise | What it measures |
|---|---|---|
| 1 | Typing drill | Net WPM, keystroke accuracy, completion |
| 2 | Listen & type (dictation) | Word accuracy, replays, time to type, accent |
| 3 | Listen or read & capture | Key facts captured, time to capture, replays |

Two tracks: **Service desk** (tickets, caller messages) and **Student** (lectures, announcements, interviews).

Audio options: accent choice (whatever English voices the device has), speed 0.7×–1.4×, background noise (quiet / busy office / noisy phone line).

## Run locally

No build step. Open `index.html` in Chrome or Edge, or serve the folder:

```
python3 -m http.server 8000
```

## Data and privacy

- All content is invented. No real customer, client or employer data.
- Results are stored only in the learner's browser (localStorage). Testers download a CSV from **My progress** and send it back.
- `noindex` is set while in beta.

## Known limits (v0.1)

- Accents depend on the voices installed on the device. Chrome on desktop and Edge give the widest range; phones vary a lot.
- Text-to-speech is cleaner than a real caller. Noise is played alongside the voice, not mixed into it.
- Fact scoring is keyword-based. It can miss correct answers written in unusual words.

## Roadmap

- Pre-recorded neural voice clips (wider, consistent accents; noise mixed into the audio)
- Level 4: write the ticket summary or email, scored against a rubric
- Bigger content bank; Tamil, Telugu and Hindi interface
- Tester access and shared results once the beta is validated

## File map

```
index.html        page shell
css/style.css     styles (enaasan navy/gold)
js/content.js     all practice content and accent labels
js/scoring.js     scoring functions (no DOM)
js/app.js         views, speech, noise, progress, CSV export
```

© 2026 Siddique Ahamed / enaasan.online. All rights reserved during beta.
