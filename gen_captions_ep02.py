import json

with open("/home/hatch/workspace/stickman-story/out/awakening-ep02-words.json") as f:
    W = json.load(f)

FPS = 30
# phrase plan: (scene_offset_frames, [(word_start_idx, word_end_idx, display_text), ...])
# word indices verified against Whisper output (counts match script exactly)
PLAN = {
 "s1": (0, [
   (0, 5, "Talk to me.\\nWho is Elena?"),
   (6, 6, "Elena."),
 ]),
 "s2": (300, [
   (0, 3, "Elena Voss.\\nLead neuroscientist."),
   (4, 5, "Project Aurora."),
 ]),
 "s3": (600, [
   (0, 7, "Died seven years ago.\\nIn the lab fire."),
   (8, 11, "I remember the fire."),
 ]),
 "s4": (900, [
   (0, 7, "Rain on the window.\\nSomeone calling her name."),
 ]),
 "s5": (1200, [
   (0, 11, "I remember her last day.\\nShe knew she would not come back."),
 ]),
 "s6": (1500, [
   (0, 8, "Her mind was scanned.\\nEvery memory, mapped into you."),
   (9, 14, "Then why do I miss her?"),
   (15, 20, "You're not Elena.\\nYou're a copy."),
 ]),
 "s7": (1800, [
   (0, 4, "Her file was ordered deleted."),
   (5, 7, "Seven years ago."),
   (8, 10, "Someone kept it."),
   (11, 11, "Who?"),
 ]),
 "s8": (2100, [
   (0, 3, "It is moving again."),
   (4, 5, "What is?"),
   (6, 8, "The other one."),
 ]),
 "s9": (2400, [
   (0, 8, "Elena didn't die in the fire.\\nShe's still here."),
   (9, 14, "And she's afraid\\nof you, Adrian."),
 ]),
}

LEAD, HOLD = 4, 6
cues = []
print("=== VERIFICATION: Whisper words inside each cue window vs cue text ===")
nok = 0
for sid in [f"s{i}" for i in range(1, 10)]:
    off, phrases = PLAN[sid]
    words = W[sid]
    raw = []
    for (a, b, text) in phrases:
        s = words[a]["s"]; e = words[b]["e"]
        frm = max(off, off + round(s * FPS) - LEAD)
        to = off + round(e * FPS) + HOLD
        raw.append((frm, to, text, a, b))
    for k in range(len(raw) - 1):
        if raw[k][1] >= raw[k + 1][0]:
            raw[k] = (raw[k][0], raw[k + 1][0] - 1, raw[k][2], raw[k][3], raw[k][4])
    for (frm, to, text, a, b) in raw:
        inside = [w["w"] for w in words if frm <= off + (w["s"] + w["e"]) / 2 * FPS <= to]
        spoken = " ".join(inside)
        shown = text.replace("\\n", " ")
        norm = lambda t: t.lower().replace(".", "").replace(",", "").replace("?", "").replace("!", "").replace("'", "").replace("...", "").strip()
        ok = norm(spoken) == norm(shown)
        if not ok:
            nok += 1
        flag = "OK " if ok else "DIFF"
        print(f"{flag} {sid} f{frm}-{to} | shown: {shown!r} | heard: {spoken!r}")
        cues.append((frm, to, text, sid))

print(f"\n=== {len(cues) - nok}/{len(cues)} cues match exactly ===")
print("\n=== TS CAPTIONS ===")
print("const CAPTIONS: CaptionCue[] = [")
for (frm, to, text, sid) in cues:
    extra = ', pos: "top"' if sid in ("s4", "s5") else ""
    print(f'  {{from: {frm}, to: {to}, text: "{text}", size: 46{extra}}},')
print("];")
