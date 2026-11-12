import json
import av
_orig_open = av.open
def _open(*a, **k):
    k.pop("metadata_errors", None)
    return _orig_open(*a, **k)
av.open = _open
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe(
    "/home/hatch/workspace/stickman-story/out/muse-awakening-ep01-with-voice.mp4",
    language="en", word_timestamps=True)
words = []
for seg in segments:
    for w in (seg.words or []):
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
print(f"transcribed {len(words)} words from current final file")
with open("/home/hatch/workspace/stickman-story/out/awakening-ep01-final-words-before.json", "w") as f:
    json.dump(words, f, indent=1)
for w in words:
    print(w)
