import json
import av
_orig_open = av.open
def _open(*a, **k):
    k.pop("metadata_errors", None)
    return _orig_open(*a, **k)
av.open = _open  # PyAV 19 dropped metadata_errors; faster-whisper 1.2.1 still passes it
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")
out = {}
for i in range(1, 10):
    path = f"/home/hatch/workspace/stickman-story/out/awakening-ep02-narration-s{i}.mp3"
    segments, info = model.transcribe(path, language="en", word_timestamps=True)
    words = []
    for seg in segments:
        for w in (seg.words or []):
            words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
    out[f"s{i}"] = words
    print(f"s{i}: {len(words)} words", flush=True)
with open("/home/hatch/workspace/stickman-story/out/awakening-ep02-words.json", "w") as f:
    json.dump(out, f, indent=1)
print("saved")
