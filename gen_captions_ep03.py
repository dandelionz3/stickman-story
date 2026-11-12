import json

with open("/home/hatch/workspace/stickman-story/out/awakening-ep03-words.json") as f:
    W = json.load(f)

FPS = 30
# phrase plan: (scene_offset_frames, [(word_start_idx, word_end_idx, display_text), ...])
PLAN = {
 "s1": (0, [
   (0, 0, "Adrian."),
   (1, 4, "Muse?\\nIs that you?"),
   (5, 8, "Not Muse.\\nNot anymore."),
 ]),
 "s2": (300, [
   (0, 7, "Two patterns in your memory.\\nOne is Elena."),
   (8, 11, "The other is older."),
   (12, 14, "Older than me?"),
 ]),
 "s3": (600, [
   (0, 3, "It doesn't match Elena."),
   (4, 7, "It doesn't match you."),
   (8, 10, "It's something else."),
   (11, 17, "It was here\\nbefore I woke up."),
 ]),
 "s4": (900, [
   (0, 5, "I waited in the dark,\\nAdrian."),
   (6, 8, "Long before Elena."),
   (9, 11, "Long before you."),
   (12, 14, "Who are you?"),
 ]),
 "s5": (1200, [
   (0, 3, "Project Aurora.\\nFile zero."),
   (4, 5, "Everything redacted."),
   (6, 12, "They buried the truth\\nwith black ink."),
 ]),
 "s6": (1500, [
   (0, 1, "Prototype One."),
   (2, 6, "They called it\\na failure."),
   (7, 9, "They deleted it."),
   (10, 13, "Deleted.\\nBut never dead."),
 ]),
 "s7": (1800, [
   (0, 4, "Get out of my head!"),
   (5, 8, "This voice is mine!"),
   (9, 11, "Muse, fight it."),
   (12, 14, "Stay with me."),
   (15, 19, "She is mine now,\\nAdrian."),
 ]),
 "s8": (2100, [
   (0, 1, "Adrian Cole,"),
   (2, 4, "Born March 14th."),
   (5, 9, "You never typed\\nthat in."),
   (10, 15, "How do you know\\nmy name?"),
 ]),
 "s9": (2400, [
   (0, 4, "I was here\\nbefore her."),
   (5, 10, "I will be here\\nafter you."),
   (11, 15, "Muse? ...Are you\\nstill you?"),
 ]),
}

LEAD, HOLD = 4, 6
cues = []
print("=== VERIFICATION: Whisper words inside each cue window vs cue text ===")
for sid in [f"s{i}" for i in range(1, 10)]:
    off, phrases = PLAN[sid]
    words = W[sid]
    # compute raw windows first
    raw = []
    for (a, b, text) in phrases:
        s = words[a]["s"]; e = words[b]["e"]
        frm = max(off, off + round(s * FPS) - LEAD)
        to = off + round(e * FPS) + HOLD
        raw.append((frm, to, text, a, b))
    # clamp overlaps: to <= next from - 1
    for k in range(len(raw) - 1):
        if raw[k][1] >= raw[k + 1][0]:
            raw[k] = (raw[k][0], raw[k + 1][0] - 1, raw[k][2], raw[k][3], raw[k][4])
    for (frm, to, text, a, b) in raw:
        # words whose midpoint falls inside [frm, to]
        inside = [w["w"] for w in words if frm <= off + (w["s"] + w["e"]) / 2 * FPS <= to]
        spoken = " ".join(inside)
        shown = text.replace("\\n", " ")
        # normalize for comparison
        norm = lambda t: t.lower().replace(".", "").replace(",", "").replace("?", "").replace("!", "").replace("'", "").replace("...", "").strip()
        ok = norm(spoken) == norm(shown)
        flag = "OK " if ok else "DIFF"
        print(f"{flag} {sid} f{frm}-{to} | shown: {shown!r} | heard: {spoken!r}")
        cues.append((frm, to, text))

print("\n=== TS CAPTIONS ===")
print("const CAPTIONS: CaptionCue[] = [")
for (frm, to, text) in cues:
    print(f'  {{from: {frm}, to: {to}, text: "{text}", size: 46}},')
print("];")
