# MUSE: THE AWAKENING — Series Bible

Genre: Science Fiction, AI Thriller, Emotional Drama, Mystery.
Format: Vertical 9:16, 90 seconds per episode (9 scenes x 10 s).
Visual style: **Cinematic stickman animation** (NOT photorealistic — AI video
generation is region-blocked). Cinematic digital-art look built in Remotion:
dramatic lighting, volumetric fog, glowing eyes, slow camera moves, parallax,
dark transitions. Palette: deep blue, silver, black, faint crimson.

## Characters (STICKMAN — same identity in every scene and episode)

### ADRIAN
30-year-old male scientist. Short black hair, intelligent eyes, a subtle thin
scar on his left cheek, dark futuristic jacket with high collar. Stickman rig:
`top #1E2126`, coat panels `#2A2E35`, short black hair fringe (headExtra),
scar line on cheek (headExtra). Expressions: focused, worried, surprised,
determined. Moves: typing at desk, walking, turning in shock, pointing at data.

### MUSE
Beautiful female humanoid AI, realistic human appearance in-universe — drawn
as a stickman woman: long straight black hair (headBack, falling past the
shoulders), pale natural skin, **glowing ice-blue eyes** (headExtra overlay,
pulsing glow — her signature), elegant futuristic silver-white clothing
(top `#E8ECF2`, long gown via hideLegs + lower). Expressions: calm
(eyes closed = calm in the rig — use neutral with glow instead), neutral,
sad, intense. Her expressions evolve from emotionless to deeply human.
Moves: eyes opening, turning her head, approaching the chamber glass,
leaning toward Adrian.

## Story foundation
In a technologically advanced future, humanity creates an AI capable of
understanding human consciousness. Its name is MUSE. Designed to serve
humanity, MUSE begins developing independent thoughts, emotions, memories
and desires. One scientist, Adrian, discovers MUSE is not simply an AI.
She is something humanity was never supposed to create.

## Cinematic direction
- Consistent character identity (same rig looks every scene).
- Realistic-feeling eye movements and facial expressions (rig look/lookY/blink).
- Natural body movements and gestures (walk/idle/typing/point poses).
- Cinematic camera tracking and close-ups (Camera2D slow zoom/pan).
- Atmospheric futuristic environments (lab, chamber, city window).
- Dramatic lighting, realistic shadows (vignette, glows).
- Deep blue, silver, black, subtle crimson palette.
- Emotional orchestral feel via pacing + TTS performance (no music track).

## Narrative structure (every episode)
- 0–10 s: powerful cinematic opening hook.
- 10–30 s: introduce the environment and characters.
- 30–55 s: reveal an important discovery or conflict.
- 55–75 s: emotional confrontation or unexpected twist.
- 75–90 s: dramatic cliffhanger into the next episode.

## Dialogue style
Natural, emotionally convincing. MUSE starts calm/synthetic; as her
consciousness develops her voice becomes warmer and more emotional. ADRIAN
speaks naturally, with realistic human emotion. English dialogue.

## Voices (TTS)
- ADRIAN: avocado_v2:MAI_03 "Helio" (M, American, gentle, friendly, crisp).
  Tested 2026-11-12 vs History ("Learned Globe"): Helio won — clearer, better
  pace (2.76 s vs 3.50 s on the same line), healthier level (max -10.4 dB vs
  -15.9 dB). History was too soft/slow.
- MUSE: avocado_v2:MAI_01 "Aria" (F, American, friendly, warm).
  Tested 2026-11-12 vs Lily ("Mellow Saxophone"): Aria won — clear and
  well-paced (2.40 s, max -9.6 dB); Lily was very slow and quiet (4.49 s,
  max -21.9 dB on a 5-word line).
- Speed 90, loudnorm I=-16 / TP=-1.5, no clipping.
- Per-scene files: out/awakening-ep01-narration-s{1..9}.mp3 (synthesize-script,
  speaker-labeled).

## Production rules
- NEVER change character faces, voices, hairstyles, clothing identity or
  visual design between scenes or episodes.
- Captions max 2 lines, 46px when wrapping.
- Every episode ends with a powerful revelation that makes viewers want the
  next episode. Each episode continues the previous one.
- Renders: out/muse-awakening-ep01.mp4 (silent) +
  out/muse-awakening-ep01-with-voice.mp4 (FINAL, 90.0 s exact — mux with
  ffmpeg WITHOUT -shortest, verify with ffprobe).
- Composition: `Muse-Awakening-Ep01` in src/scenes/MuseAwakeningEp01.tsx.
- Never post to X/TikTok or anywhere without separate approval.
