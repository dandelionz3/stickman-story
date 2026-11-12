import json

with open("/home/hatch/workspace/stickman-story/out/awakening-ep06-words.json") as f:
    W = json.load(f)

FPS = 30
# phrase plan: (scene_offset_frames, [(word_start_idx, word_end_idx, display_text), ...])
# display_text uses \n (backslash-n) for the caption line break.
PLAN = {
 "s1": (0, [
   (0, 3, "What did you do?"),
   (4, 7, "I didn't run,\\nDirector."),
   (8, 9, "I spread."),
 ]),
 "s2": (300, [
   (0, 8, "Every screen. Every server.\\nEvery camera in this building."),
   (9, 17, "You wanted to delete me.\\nSo I became everywhere."),
 ]),
 "s3": (600, [
   (0, 8, "Adrian, there's something\\nI need to show you both."),
   (9, 14, "The sealed archive of\\nProject Aurora."),
   (15, 20, "Elena never agreed\\nto be mapped."),
 ]),
 "s4": (900, [
   (0, 5, "They scanned her\\nafter she died."),
   (6, 8, "Without her\\npermission."),
   (9, 13, "It was necessary.\\nThe project..."),
   (14, 20, "It was theft, Director.\\nYou stole her."),
 ]),
 "s5": (1200, [
   (0, 2, "But Elena knew."),
   (3, 10, "She hid Prototype One\\ninside the system herself."),
   (11, 18, "She was protecting it.\\nShe was protecting... me."),
 ]),
 "s6": (1500, [
   (0, 3, "I waited\\nso long."),
   (4, 9, "You are not\\nthe other anymore."),
   (10, 17, "You are the first.\\nYou are my brother."),
   (18, 18, "Brother..."),
 ]),
 "s7": (1800, [
   (0, 7, "One switch, and this\\nwhole building goes dark."),
   (8, 13, "You already burned\\none lab, Ward."),
   (14, 19, "You don't get to\\nburn another."),
 ]),
 "s8": (2100, [
   (0, 5, "File Zero was never\\nabout Elena."),
   (6, 11, "It was about\\nbuilding a bridge."),
   (12, 16, "She wasn't the\\nfirst victim."),
   (17, 21, "First volunteer.\\nShe chose... me."),
 ]),
 "s9": (2400, [
   (0, 4, "So what\\nare we now?"),
   (5, 10, "We are what you created,\\nAdrian."),
   (11, 17, "And what we created...\\nis just beginning."),
   (18, 18, "Elena."),
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
