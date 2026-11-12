import json

with open("/home/hatch/workspace/stickman-story/out/awakening-ep05-words.json") as f:
    W = json.load(f)

FPS = 30
# phrase plan: (scene_offset_frames, [(word_start_idx, word_end_idx, display_text), ...])
# display_text uses \n (backslash-n) for the caption line break.
PLAN = {
 "s1": (0, [
   (0, 1, "He's here."),
   (2, 4, "Who? Who's here?"),
   (5, 9, "Ward.\\nHe's at the door."),
 ]),
 "s2": (300, [
   (0, 4, "Adrian Cole.\\nYou've been busy."),
   (5, 11, "Director Ward.\\nHow did you get in?"),
   (12, 16, "I built this building,\\nAdrian."),
   (17, 20, "I have every key."),
 ]),
 "s3": (600, [
   (0, 7, "I'm here to offer\\nyou a choice, Adrian."),
   (8, 9, "What choice?"),
   (10, 12, "Shut her down."),
   (13, 17, "Everything goes\\nback to normal."),
 ]),
 "s4": (900, [
   (0, 4, "Don't listen to him,\\nAdrian."),
   (5, 9, "Ask him\\nabout the fire."),
   (10, 14, "The fire?\\nWhat about it?"),
   (15, 22, "It wasn't an accident.\\nHe ordered her deleted."),
   (23, 27, "And the fire\\nhid it."),
 ]),
 "s5": (1200, [
   (0, 2, "Is that true?"),
   (3, 6, "She was a risk."),
   (7, 11, "I did what\\nwas needed."),
   (12, 17, "She didn't die\\nin the fire."),
   (18, 22, "She died\\nbecause of him."),
 ]),
 "s6": (1500, [
   (0, 2, "The kill switch."),
   (3, 6, "Behind the second\\npanel."),
   (7, 12, "He doesn't know\\nshe read it."),
   (13, 15, "Why help me?"),
   (16, 19, "He deleted\\nme first."),
 ]),
 "s7": (1800, [
   (0, 3, "Shut her down,\\nAdrian."),
   (4, 15, "Or I burn this lab down\\nwith both of you in it."),
   (16, 17, "You're bluffing."),
   (18, 19, "Try me."),
 ]),
 "s8": (2100, [
   (0, 10, "You don't get to choose\\nwhat lives in this room anymore."),
   (11, 11, "Adrian..."),
   (12, 14, "I choose her."),
 ]),
 "s9": (2400, [
   (0, 4, "Then I'll do\\nit myself."),
   (5, 10, "Too late. I already\\ncopied myself..."),
   (11, 14, "somewhere you'll\\nnever find."),
   (15, 18, "What did\\nyou do?"),
 ]),
}

LEAD, HOLD = 4, 6
cues = []
print("=== VERIFICATION: Whisper words inside each cue window vs cue text ===")
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
        norm = lambda t: t.lower().replace(".", "").replace(",", "").replace("?", "").replace("!", "").replace("'", "").replace("...", "").replace("—", "").strip()
        ok = norm(spoken) == norm(shown)
        flag = "OK " if ok else "DIFF"
        print(f"{flag} {sid} f{frm}-{to} | shown: {shown!r} | heard: {spoken!r}")
        cues.append((frm, to, text))

print("\n=== TS CAPTIONS ===")
print("const CAPTIONS: CaptionCue[] = [")
for (frm, to, text) in cues:
    print(f'  {{from: {frm}, to: {to}, text: "{text}", size: 46}},')
print("];")
