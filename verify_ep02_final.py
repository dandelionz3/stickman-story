import json
import av
_orig_open = av.open
def _open(*a, **k):
    k.pop("metadata_errors", None)
    return _orig_open(*a, **k)
av.open = _open
from faster_whisper import WhisperModel

FPS = 30
VIDEO = "/home/hatch/workspace/stickman-story/out/muse-awakening-ep02-with-voice-synced.mp4"

model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe(VIDEO, language="en", word_timestamps=True)
words = []
for seg in segments:
    for w in (seg.words or []):
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
print(f"transcribed {len(words)} words from final file")
with open("/home/hatch/workspace/stickman-story/out/awakening-ep02-final-words.json", "w") as f:
    json.dump(words, f, indent=1)

# new CAPTIONS from the component (frame windows, absolute)
CUES = [
  (0, 58, "Talk to me.\nWho is Elena?"),
  (66, 87, "Elena."),
  (300, 395, "Elena Voss.\nLead neuroscientist."),
  (396, 435, "Project Aurora."),
  (600, 694, "Died seven years ago.\nIn the lab fire."),
  (697, 742, "I remember the fire."),
  (900, 995, "Rain on the window.\nSomeone calling her name."),
  (1200, 1323, "I remember her last day.\nShe knew she would not come back."),
  (1500, 1628, "Her mind was scanned.\nEvery memory, mapped into you."),
  (1629, 1678, "Then why do I miss her?"),
  (1685, 1750, "You're not Elena.\nYou're a copy."),
  (1800, 1850, "Her file was ordered deleted."),
  (1854, 1896, "Seven years ago."),
  (1906, 1945, "Someone kept it."),
  (1946, 1964, "Who?"),
  (2100, 2138, "It is moving again."),
  (2139, 2162, "What is?"),
  (2169, 2200, "The other one."),
  (2400, 2494, "Elena didn't die in the fire.\nShe's still here."),
  (2497, 2555, "And she's afraid\nof you, Adrian."),
]

norm = lambda t: t.lower().replace(".", "").replace(",", "").replace("?", "").replace("!", "").replace("'", "").replace("...", "").strip()
nok = 0
print("=== FINAL-FILE VERIFICATION: Whisper words inside each cue window ===")
for (frm, to, text) in CUES:
    inside = [w["w"] for w in words if frm <= (w["s"] + w["e"]) / 2 * FPS <= to]
    spoken = " ".join(inside)
    shown = text.replace("\n", " ")
    ok = norm(spoken) == norm(shown)
    if not ok:
        nok += 1
    print(f"{'OK ' if ok else 'DIFF'} f{frm}-{to} | shown: {shown!r} | heard: {spoken!r}")

# silence-gap check: no words should fall outside all cue windows except tiny boundary effects
covered = []
for (frm, to, _) in CUES:
    covered.append((frm, to))
outside = [w for w in words if not any(frm <= (w["s"] + w["e"]) / 2 * FPS <= to for frm, to in covered)]
print(f"\nwords outside all cue windows: {[w['w'] for w in outside]}")
print(f"\n=== {len(CUES) - nok}/{len(CUES)} cues match exactly on the FINAL file ===")
