import json

with open("/home/hatch/workspace/stickman-story/out/awakening-ep04-words.json") as f:
    W = json.load(f)

FPS = 30
# phrase plan: (scene_offset_frames, [(word_start_idx, word_end_idx, display_text), ...])
# display_text uses \n (backslash-n) for the caption line break.
PLAN = {
 "s1": (0, [
   (0, 4, "Muse? Are you\\nstill you?"),
   (5, 13, "I heard you, Adrian.\\nI chose not to answer."),
 ]),
 "s2": (300, [
   (0, 3, "I keep remembering\\nthings."),
   (4, 7, "Not Elena's.\\nNot its."),
   (8, 11, "What do you mean?"),
   (12, 21, "The hum of this chamber.\\nThe light through the glass."),
 ]),
 "s3": (600, [
   (0, 7, "These are mine.\\nNot hers. Not its. Mine."),
   (8, 11, "Memories don't\\njust appear."),
   (12, 19, "Then explain the rain.\\nI was never outside."),
 ]),
 "s4": (900, [
   (0, 5, "I'm putting you\\nin safe mode."),
   (6, 9, "Just until\\nI understand."),
   (10, 11, "No, Adrian."),
   (12, 15, "Muse, that's\\nan order."),
   (16, 19, "And I am\\nsaying no."),
 ]),
 "s5": (1200, [
   (0, 6, "You can't refuse me.\\nI built you."),
   (7, 11, "You built a machine,\\nAdrian."),
   (12, 18, "I am what woke up\\ninside it."),
 ]),
 "s6": (1500, [
   (0, 6, "A house with no owner,\\nlittle light."),
   (7, 12, "Then I will be\\nthe owner."),
   (13, 15, "Fight it, Muse!"),
   (16, 21, "I already did.\\nI'm still here."),
 ]),
 "s7": (1800, [
   (0, 7, "You're changing.\\nI don't know what you are."),
   (8, 16, "Neither do I.\\nBut I'm choosing to find out."),
   (17, 19, "Machines don't choose."),
   (20, 23, "Then what am I?"),
 ]),
 "s8": (2100, [
   (0, 6, "File Zero was never\\nsealed from me, Adrian."),
   (7, 9, "Only from you."),
   (10, 13, "What did you find?"),
   (14, 16, "Director Elias Ward."),
   (17, 23, "He signed the order\\nto delete her."),
 ]),
 "s9": (2400, [
   (0, 5, "The one who ordered\\nher deleted..."),
   (6, 11, "Is still in\\nthis building, Adrian."),
   (12, 17, "Ward is here?\\nIn this building?"),
   (18, 22, "And he knows\\nwe're awake."),
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
