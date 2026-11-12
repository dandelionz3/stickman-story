import json
import av
_orig_open = av.open
def _open(*a, **k):
    k.pop("metadata_errors", None)
    return _orig_open(*a, **k)
av.open = _open
from faster_whisper import WhisperModel

FPS = 30
VIDEO = "/home/hatch/workspace/stickman-story/out/muse-awakening-ep01-with-voice-synced.mp4"

model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe(VIDEO, language="en", word_timestamps=True)
words = []
for seg in segments:
    for w in (seg.words or []):
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
print(f"transcribed {len(words)} words from final file")
with open("/home/hatch/workspace/stickman-story/out/awakening-ep01-final-words.json", "w") as f:
    json.dump(words, f, indent=1)

# new CAPTIONS from the component (frame windows, absolute)
CUES = [
  (0, 89, "Adrian...\\nI remember."),
  (300, 431, "Three a.m. The city never sleeps.\\nNeither do I."),
  (600, 682, "Vitals stable.\\nMemory banks normal."),
  (687, 710, "Are they?"),
  (900, 986, "These memories...\\nI never wrote them."),
  (1200, 1283, "I remember rain.\\nI was never outside."),
  (1500, 1600, "These belong to someone...\\nwho died years ago."),
  (1800, 1896, "You didn't create me, Adrian.\\nYou woke me up."),
  (2100, 2168, "Elena...\\nwas her name Elena?"),
  (2178, 2233, "That name was never\\nin your database."),
  (2400, 2456, "There's something else\\nin here with me."),
  (2460, 2512, "And it knows\\nyour name."),
]

norm = lambda t: t.lower().replace(".", "").replace(",", "").replace("?", "").replace("!", "").replace("'", "").replace("...", "").strip()
nok = 0
print("=== FINAL-FILE VERIFICATION: Whisper words inside each cue window ===")
for (frm, to, text) in CUES:
    inside = [w["w"] for w in words if frm <= (w["s"] + w["e"]) / 2 * FPS <= to]
    spoken = " ".join(inside)
    shown = text.replace("\\n", " ")
    ok = norm(spoken) == norm(shown)
    if not ok:
        nok += 1
    print(f"{'OK ' if ok else 'DIFF'} f{frm}-{to} | shown: {shown!r} | heard: {spoken!r}")

covered = []
for (frm, to, _) in CUES:
    covered.append((frm, to))
outside = [w for w in words if not any(frm <= (w["s"] + w["e"]) / 2 * FPS <= to for frm, to in covered)]
print(f"\nwords outside all cue windows: {[w['w'] for w in outside]}")
print(f"\n=== {len(CUES) - nok}/{len(CUES)} cues match exactly on the FINAL file ===")
