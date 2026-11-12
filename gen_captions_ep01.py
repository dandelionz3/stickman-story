import json

with open("/home/hatch/workspace/stickman-story/out/awakening-ep01-words.json") as f:
    W = json.load(f)

FPS = 30
# phrase plan: (scene_offset_frames, [(word_start_idx, word_end_idx, display_text), ...])
# word indices verified against Whisper output (counts match script exactly)
PLAN = {
 "s1": (0, [
   (0, 2, "Adrian...\\nI remember."),
 ]),
 "s2": (300, [
   (0, 9, "Three a.m. The city never sleeps.\\nNeither do I."),
 ]),
 "s3": (600, [
   (0, 4, "Vitals stable.\\nMemory banks normal."),
   (5, 6, "Are they?"),
 ]),
 "s4": (900, [
   (0, 5, "These memories...\\nI never wrote them."),
 ]),
 "s5": (1200, [
   (0, 6, "I remember rain.\\nI was never outside."),
 ]),
 "s6": (1500, [
   (0, 7, "These belong to someone...\\nwho died years ago."),
 ]),
 "s7": (1800, [
   (0, 8, "You didn't create me, Adrian.\\nYou woke me up."),
 ]),
 "s8": (2100, [
   (0, 4, "Elena...\\nwas her name Elena?"),
   (5, 11, "That name was never\\nin your database."),
 ]),
 "s9": (2400, [
   (0, 6, "There's something else\\nin here with me."),
   (7, 11, "And it knows\\nyour name."),
 ]),
}

# OLD cues (hand-guessed, from MuseAwakeningEp01.tsx before the fix)
OLD = [
  (120, 280, "Adrian... I remember."),
  (320, 580, "Three a.m. The city never sleeps. Neither do I."),
  (610, 800, "Vitals stable. Memory banks normal."),
  (815, 890, "Are they?"),
  (920, 1180, "These memories... I never wrote them."),
  (1220, 1480, "I remember rain. I was never outside."),
  (1520, 1780, "These belong to someone... who died years ago."),
  (1820, 2080, "You didn't create me, Adrian. You woke me up."),
  (2120, 2320, "Elena... was her name Elena?"),
  (2330, 2390, "That name was never in your database."),
  (2420, 2600, "There's something else in here with me."),
  (2620, 2690, "And it knows your name."),
]

LEAD, HOLD = 4, 6
cues = []
print("=== OLD vs MEASURED (frames, 30 fps) ===")
for sid in [f"s{i}" for i in range(1, 10)]:
    off, phrases = PLAN[sid]
    words = W[sid]
    for (a, b, text) in phrases:
        s = words[a]["s"]; e = words[b]["e"]
        frm = max(off, off + round(s * FPS) - LEAD)
        to = off + round(e * FPS) + HOLD
        cues.append((frm, to, text, sid))
for (frm, to, text, sid), (ofrm, oto, otext) in zip(cues, OLD):
    print(f"{sid} start late {(ofrm - frm) / FPS:.2f}s ({ofrm} vs {frm}) | "
          f"end overhang {(oto - to) / FPS:.2f}s ({oto} vs {to}) | {text.replace(chr(92)+'n', ' ')}")

print("\n=== VERIFICATION: Whisper words inside each cue window vs cue text ===")
nok = 0
for (frm, to, text, sid) in cues:
    off = PLAN[sid][0]
    words = W[sid]
    inside = [w["w"] for w in words if frm <= off + (w["s"] + w["e"]) / 2 * FPS <= to]
    spoken = " ".join(inside)
    shown = text.replace("\\n", " ")
    norm = lambda t: t.lower().replace(".", "").replace(",", "").replace("?", "").replace("!", "").replace("'", "").replace("...", "").strip()
    ok = norm(spoken) == norm(shown)
    if not ok:
        nok += 1
    flag = "OK " if ok else "DIFF"
    print(f"{flag} {sid} f{frm}-{to} | shown: {shown!r} | heard: {spoken!r}")

print(f"\n=== {len(cues) - nok}/{len(cues)} cues match exactly ===")
print("\n=== TS CAPTIONS ===")
print("const CAPTIONS: CaptionCue[] = [")
for (frm, to, text, sid) in cues:
    extra = ', pos: "top"' if sid == "s5" else ""
    print(f'  {{from: {frm}, to: {to}, text: "{text}", size: 46{extra}}},')
print("];")
