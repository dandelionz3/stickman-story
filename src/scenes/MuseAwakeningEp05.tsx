import React, {useEffect, useState} from "react";
import {AbsoluteFill, Sequence, useCurrentFrame, continueRender, delayRender} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Desk, Floor, FLOOR, Glow, Label, Monitor, OfficeChair} from "../environment/Furniture";
import {clamp, eOut, eInOut, keys, keysObj, prog, rand} from "../motion/ease";
import {idle, point, typing} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * MUSE: THE AWAKENING — EPISODE 05 "The Choice"
 * 90 s, nine scenes. Direct continuation of Episode 04's cliffhanger:
 * "The one who ordered her deleted... is still in this building, Adrian."
 * "Ward is here? In this building?" / "And he knows we're awake."
 * DIRECTOR ELIAS WARD enters the lab in person. He is cold, calm,
 * dangerous — he never shouts; he offers "reasonable choices". The lab
 * fire seven years ago was NOT an accident: Ward ordered Elena deleted,
 * and the fire was set to cover it. The Other helps Adrian for the first
 * time — it tells him where the real kill switch is, because Ward deleted
 * IT first. Adrian's CHOICE: he does NOT press the kill switch. He
 * destroys it. "You don't get to choose what lives in this room anymore."
 * And Muse has already copied herself somewhere Ward will never find.
 * Same stickman rigs and visual language as Ep 01-04 (see awakening/BIBLE.md):
 *   - ADRIAN: short black hair, cheek scar, dark futuristic jacket.
 *   - MUSE: long straight black hair, GLOWING ice-blue eyes, silver-white gown.
 *   - THE OTHER: same body as MUSE, but her eyes burn CRIMSON when it
 *     takes over; its voice is ElvenWizard (gravelly, otherworldly).
 *   - WARD (NEW): tall, dark suit, neat GREY hair, cold eyes. His voice
 *     is avocado_v2:History ("Learned Globe") — cold, calm, deliberate.
 *     (MAI_02 was tested: it silently falls back to Helio/MAI_03 — unusable
 *     for Ward, he must NOT sound like Adrian.)
 * English dialogue; ADRIAN = Helio (MAI_03), MUSE = Aria (MAI_01),
 * OTHER = ElvenWizard, WARD = History.
 * Narration muxed in afterwards (ffmpeg, no -shortest).
 *
 * OPENING RULE (lesson from Meta Creator Assistant feedback on the TermiX
 * reel — only 22.4% of viewers stayed past 3 s because the opening was too
 * dark and still): the first 3 SECONDS hit hard. Scene 1 opens at full
 * intensity — red alarm strobing, the lab door shaking under a knock, big
 * text HE'S HERE, Muse's eyes already wide — NO slow dark fade-in.
 * Tension first, explanation later.
 *
 * CAPTIONS — timed from MEASURED Whisper word timestamps
 * (out/awakening-ep05-words.json, faster-whisper base, word_timestamps).
 * Every cue's window covers exactly the words it shows (lead 4f, hold 6f);
 * verified: 34/37 cues match Whisper's heard words exactly — the 3 diffs
 * are Whisper mishearings of the exact TTS text ("him, Adrian"→"a
 * majorian", "hid"→"hit", "Adrian..."→"Adrienne."). Never guess caption
 * timing — measure it.
 */

export const MUSE_AWAKENING_EP05_FRAMES = 2700;
const S1 = {from: 0, len: 300}; // 0-10 s    hook: "HE'S HERE" — red alarm, knocking door
const S2 = {from: 300, len: 300}; // 10-20 s  Ward enters — he has every key
const S3 = {from: 600, len: 300}; // 20-30 s  the reasonable offer
const S4 = {from: 900, len: 300}; // 30-40 s  ask him about the fire
const S5 = {from: 1200, len: 300}; // 40-50 s  she died because of him
const S6 = {from: 1500, len: 300}; // 50-60 s  the Other helps — the kill switch
const S7 = {from: 1800, len: 300}; // 60-70 s  the ultimatum
const S8 = {from: 2100, len: 300}; // 70-80 s  THE CHOICE — he destroys the switch
const S9 = {from: 2400, len: 300}; // 80-90 s  cliffhanger: she already copied herself

const CAPTIONS: CaptionCue[] = [
  {from: 0, to: 26, text: "He's here.", size: 46},
  {from: 27, to: 87, text: "Who? Who's here?", size: 46},
  {from: 93, to: 143, text: "Ward.\nHe's at the door.", size: 46},
  {from: 300, to: 364, text: "Adrian Cole.\nYou've been busy.", size: 46},
  {from: 369, to: 438, text: "Director Ward.\nHow did you get in?", size: 46},
  {from: 447, to: 495, text: "I built this building,\nAdrian.", size: 46},
  {from: 504, to: 544, text: "I have every key.", size: 46},
  {from: 600, to: 676, text: "I'm here to offer\nyou a choice, Adrian.", size: 46},
  {from: 685, to: 709, text: "What choice?", size: 46},
  {from: 720, to: 747, text: "Shut her down.", size: 46},
  {from: 750, to: 799, text: "Everything goes\nback to normal.", size: 46},
  {from: 900, to: 942, text: "Don't listen to him,\nAdrian.", size: 46},
  {from: 943, to: 983, text: "Ask him\nabout the fire.", size: 46},
  {from: 987, to: 1043, text: "The fire?\nWhat about it?", size: 46},
  {from: 1047, to: 1125, text: "It wasn't an accident.\nHe ordered her deleted.", size: 46},
  {from: 1126, to: 1181, text: "And the fire\nhid it.", size: 46},
  {from: 1200, to: 1229, text: "Is that true?", size: 46},
  {from: 1241, to: 1279, text: "She was a risk.", size: 46},
  {from: 1288, to: 1334, text: "I did what\nwas needed.", size: 46},
  {from: 1338, to: 1387, text: "She didn't die\nin the fire.", size: 46},
  {from: 1395, to: 1447, text: "She died\nbecause of him.", size: 46},
  {from: 1500, to: 1538, text: "The kill switch.", size: 46},
  {from: 1542, to: 1601, text: "Behind the second\npanel.", size: 46},
  {from: 1613, to: 1673, text: "He doesn't know\nshe read it.", size: 46},
  {from: 1675, to: 1706, text: "Why help me?", size: 46},
  {from: 1716, to: 1775, text: "He deleted\nme first.", size: 46},
  {from: 1800, to: 1836, text: "Shut her down,\nAdrian.", size: 46},
  {from: 1837, to: 1914, text: "Or I burn this lab down\nwith both of you in it.", size: 46},
  {from: 1915, to: 1946, text: "You're bluffing.", size: 46},
  {from: 1954, to: 1979, text: "Try me.", size: 46},
  {from: 2100, to: 2180, text: "You don't get to choose\nwhat lives in this room anymore.", size: 46},
  {from: 2185, to: 2210, text: "Adrian...", size: 46},
  {from: 2212, to: 2244, text: "I choose her.", size: 46},
  {from: 2400, to: 2438, text: "Then I'll do\nit myself.", size: 46},
  {from: 2443, to: 2519, text: "Too late. I already\ncopied myself...", size: 46},
  {from: 2527, to: 2581, text: "somewhere you'll\nnever find.", size: 46},
  {from: 2590, to: 2620, text: "What did\nyou do?", size: 46},
];

const ICE = "#9FE3FF";
const ICE_DEEP = "#4FB8F0";
const SILVER = "#C8D2DC";
const CRIMSON = "#C0392B";
const AMBER = "#E8A34C";
const EMBER = "#FF7A3C";
const BG = "#070D18";

/** Adrian: short black hair + cheek scar, drawn in the head frame. */
const AdrianHair: React.FC = () => (
  <g>
    <path d="M -36 -4 A 36 36 0 0 1 36 -4 L 36 -12 A 36 36 0 0 0 -36 -12 Z" fill="#0B0C0E" stroke={C.ink} strokeWidth={2.5} />
    <path d="M -36 -4 A 36 36 0 0 1 36 -4 Z" fill="#0B0C0E" />
    {/* subtle scar on the left cheek */}
    <line x1={13} y1={7} x2={21} y2={18} stroke="#9AA0A8" strokeWidth={2} strokeLinecap="round" />
    <line x1={10} y1={12} x2={16} y2={11} stroke="#9AA0A8" strokeWidth={1.6} strokeLinecap="round" />
  </g>
);

const ADRIAN: Look = {
  top: "#1E2126",
  sleeve: "#23262B",
  coat: "#2A2E35",
  trousers: "#23262B",
  skin: C.bone,
  headExtra: <AdrianHair />,
};

/** MUSE: long straight black hair falling past the shoulders (head frame). */
const MuseHairBack: React.FC = () => (
  <g>
    <path
      d="M -36 -8 C -54 -44 -50 60 -45 132 L -28 132 C -33 60 -30 -18 -22 -28 L 22 -28 C 30 -18 33 60 28 132 L 45 132 C 50 60 54 -44 36 -8 A 36 36 0 0 0 -36 -8 Z"
      fill="#0B0C0E"
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d="M -36 -4 A 36 36 0 0 1 36 -4 Z" fill="#0B0C0E" />
  </g>
);

/**
 * MUSE's glowing ice-blue eyes, drawn OVER the rig's ink eyes in the head
 * frame. `open` 0..1 = eyes opening; `pulse` adds a breathing shimmer.
 * `crimson` 0..1 = the other presence bleeding through — her eyes flare red.
 */
const MuseEyes: React.FC<{open: number; pulse: number; crimson?: number}> = ({open, pulse, crimson = 0}) => (
  <g opacity={clamp(open, 0, 1)}>
    <circle cx={-11} cy={-3} r={11 + pulse * 3} fill={ICE} opacity={0.22} />
    <circle cx={11} cy={-3} r={11 + pulse * 3} fill={ICE} opacity={0.22} />
    <circle cx={-11} cy={-3} r={5.5} fill="#BFEFFF" />
    <circle cx={11} cy={-3} r={5.5} fill="#BFEFFF" />
    <circle cx={-11} cy={-3} r={2.4} fill="#FFFFFF" />
    <circle cx={11} cy={-3} r={2.4} fill="#FFFFFF" />
    {/* crimson bleed-through */}
    <g opacity={clamp(crimson, 0, 1)}>
      <circle cx={-11} cy={-3} r={9} fill={CRIMSON} opacity={0.35} />
      <circle cx={11} cy={-3} r={9} fill={CRIMSON} opacity={0.35} />
      <circle cx={-11} cy={-3} r={4.5} fill="#FF6B57" />
      <circle cx={11} cy={-3} r={4.5} fill="#FF6B57" />
    </g>
  </g>
);

/** MUSE's long silver-white gown (root frame, replaces the legs). */
const MuseGown: React.FC = () => (
  <g>
    <path d="M -34 -118 L 34 -118 L 54 0 L -54 0 Z" fill="#E8ECF2" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <line x1={0} y1={-108} x2={0} y2={-8} stroke="#B9C2CC" strokeWidth={2} opacity={0.7} />
    <path d="M -34 -118 L -20 -118 L -30 0 L -54 0 Z" fill="#DDE3EA" opacity={0.6} />
  </g>
);

const museLook = (eyesOpen: number, pulse: number, crimson = 0): Look => ({
  top: "#E8ECF2",
  sleeve: "#DDE3EA",
  skin: "#F2EDE4",
  hideLegs: true,
  headBack: <MuseHairBack />,
  headExtra: <MuseEyes open={eyesOpen} pulse={pulse} crimson={crimson} />,
  lower: <MuseGown />,
});

/** MUSE idle without blinking — an AI does not blink like a human. */
const museIdle = (t: number, seed = 0) => ({...idle(t, seed), blink: 0});

/** WARD: neat grey hair, swept back, drawn in the head frame. */
const WardHair: React.FC = () => (
  <g>
    <path d="M -36 -6 A 36 36 0 0 1 36 -6 L 36 -14 A 36 36 0 0 0 -36 -14 Z" fill="#8A8F96" stroke={C.ink} strokeWidth={2.5} />
    <path d="M -36 -6 A 36 36 0 0 1 36 -6 Z" fill="#8A8F96" />
    <line x1={-18} y1={-10} x2={-4} y2={-16} stroke="#6E737A" strokeWidth={2} strokeLinecap="round" />
    <line x1={2} y1={-12} x2={16} y2={-16} stroke="#6E737A" strokeWidth={2} strokeLinecap="round" />
  </g>
);

/** WARD's cold eyes — narrow, grey-blue, no warmth. */
const WardEyes: React.FC = () => (
  <g>
    <line x1={-19} y1={-6} x2={-3} y2={-4} stroke="#5A6B7C" strokeWidth={3} strokeLinecap="round" />
    <line x1={3} y1={-4} x2={19} y2={-6} stroke="#5A6B7C" strokeWidth={3} strokeLinecap="round" />
    <circle cx={-11} cy={-3} r={2.2} fill="#8FA8BC" />
    <circle cx={11} cy={-3} r={2.2} fill="#8FA8BC" />
  </g>
);

const WARD: Look = {
  top: "#17191D",
  sleeve: "#1E2126",
  coat: "#23262B",
  trousers: "#14161A",
  skin: "#D8CFC2",
  headExtra: (
    <g>
      <WardHair />
      <WardEyes />
    </g>
  ),
};

/** Ward idle — barely moves. A man who never hurries, never fidgets. */
const wardIdle = (t: number) => ({...idle(t * 0.3, 11), blink: 0});

/** Faint stars / dust motes drifting in the dark (deterministic). */
const Dust: React.FC<{t: number; n?: number}> = ({t, n = 40}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const sx = (rand(i * 7 + 1) - 0.5) * 1040;
      const sy = -700 + rand(i * 7 + 2) * 900;
      const tw = 0.15 + 0.4 * Math.abs(Math.sin(t * 0.7 + i * 1.7));
      return <circle key={i} cx={sx} cy={sy} r={1.2 + rand(i * 7 + 3) * 1.8} fill="#BFE3FF" opacity={tw} />;
    })}
  </g>
);

/** Slow-drifting fog banks: big soft glows. */
const Fog: React.FC<{t: number}> = ({t}) => (
  <g>
    <Glow x={-320 + Math.sin(t * 0.11) * 60} y={-160} r={420} color="#7FB8D8" opacity={0.07} />
    <Glow x={340 + Math.cos(t * 0.09) * 70} y={120} r={480} color="#5A8FC0" opacity={0.06} />
    <Glow x={0} y={-420} r={520} color="#3D6FA8" opacity={0.05} />
  </g>
);

/** Crimson fog — used when the Other is present. */
const CrimsonFog: React.FC<{t: number; strength?: number}> = ({t, strength = 1}) => (
  <g>
    <Glow x={-260 + Math.sin(t * 0.13) * 50} y={-180} r={460} color={CRIMSON} opacity={0.09 * strength} />
    <Glow x={300 + Math.cos(t * 0.1) * 60} y={100} r={480} color="#8E2418" opacity={0.08 * strength} />
  </g>
);

/** Cinematic vignette + top gradient, screen-space (outside the camera). */
const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%), linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.6) 100%)",
    }}
  />
);

/** City skyline seen through the lab window (background layer). */
const CityWindow: React.FC<{t: number}> = ({t}) => {
  const buildings = [
    {x: -460, w: 110, h: 260},
    {x: -330, w: 80, h: 180},
    {x: -230, w: 120, h: 300},
    {x: -90, w: 90, h: 210},
    {x: 20, w: 130, h: 340},
    {x: 170, w: 90, h: 240},
    {x: 280, w: 120, h: 310},
    {x: 420, w: 100, h: 190},
  ];
  return (
    <g>
      <rect x={-520} y={-760} width={1040} height={620} rx={18} fill="#0A1424" stroke="#2A3A52" strokeWidth={4} />
      <rect x={-520} y={-760} width={1040} height={620} rx={18} fill="none" stroke={ICE} strokeWidth={1.5} opacity={0.25} />
      {/* night sky + moon */}
      <circle cx={330} cy={-640} r={42} fill="#DCE9F5" opacity={0.9} />
      <circle cx={316} cy={-652} r={10} fill="#B9C9DA" opacity={0.7} />
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={-140 - b.h} width={b.w} height={b.h} fill="#060B14" />
          {Array.from({length: Math.floor(b.h / 42)}).map((_, r) =>
            Array.from({length: Math.floor(b.w / 30)}).map((_, c) => {
              const lit = rand(i * 91 + r * 7 + c * 3) > 0.6;
              const flick = lit ? 0.5 + 0.4 * Math.abs(Math.sin(t * 0.8 + i * 2 + r)) : 0;
              return lit ? (
                <rect key={`${r}-${c}`} x={b.x + 10 + c * 30} y={-140 - b.h + 12 + r * 42} width={11} height={14} fill={i % 4 === 0 ? ICE : "#FFD23C"} opacity={flick} />
              ) : null;
            }),
          )}
        </g>
      ))}
    </g>
  );
};

/** The glass containment chamber (shared by scenes 1, 4, 7, 9). */
const ChamberGlass: React.FC<{x: number; glow?: number; red?: number}> = ({x, glow = 0.16, red = 0}) => (
  <g>
    <Glow x={x} y={-140} r={380} color={ICE} opacity={glow} />
    <Glow x={x} y={-140} r={380} color={CRIMSON} opacity={red * 0.25} />
    <rect x={x - 150} y={-560} width={300} height={980} rx={40} fill={ICE} opacity={0.05} stroke={red > 0.4 ? CRIMSON : ICE} strokeWidth={4} />
    <rect x={x - 150} y={-560} width={300} height={980} rx={40} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.25} />
    <line x1={x - 90} y1={-540} x2={x - 90} y2={400} stroke={ICE} strokeWidth={3} opacity={0.35} />
    <line x1={x + 90} y1={-540} x2={x + 90} y2={400} stroke={ICE} strokeWidth={3} opacity={0.35} />
    <rect x={x - 170} y={-580} width={340} height={26} rx={8} fill="#1A2434" stroke={ICE} strokeWidth={2} />
    <rect x={x - 170} y={400} width={340} height={26} rx={8} fill="#1A2434" stroke={ICE} strokeWidth={2} />
  </g>
);

/** The lab door — tall, heavy, with a small window and a handle. */
const LabDoor: React.FC<{x: number; shake?: number; open?: number}> = ({x, shake = 0, open = 0}) => (
  <g transform={`translate(${shake + open * 260}, 0)`}>
    <rect x={x - 110} y={-560} width={220} height={980} rx={12} fill="#131A26" stroke="#2A3A52" strokeWidth={4} />
    <rect x={x - 70} y={-480} width={140} height={180} rx={8} fill="#0A1424" stroke={ICE} strokeWidth={2} opacity={0.6} />
    <rect x={x + 62} y={-80} width={26} height={70} rx={10} fill={SILVER} stroke={C.ink} strokeWidth={2} />
    <rect x={x - 110} y={-560} width={220} height={980} rx={12} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.12} />
  </g>
);

/** Wall-mounted kill switch: red box with a lever. */
const KillSwitch: React.FC<{x: number; y: number; gone?: number}> = ({x, y, gone = 0}) => (
  <g opacity={1 - gone}>
    <rect x={x - 46} y={y - 60} width={92} height={120} rx={10} fill="#1A1214" stroke={CRIMSON} strokeWidth={3} />
    <rect x={x - 30} y={y - 40} width={60} height={34} rx={6} fill={CRIMSON} />
    <line x1={x} y1={y - 6} x2={x + 26} y2={y + 34} stroke={SILVER} strokeWidth={6} strokeLinecap="round" />
    <circle cx={x} cy={y - 6} r={8} fill={SILVER} stroke={C.ink} strokeWidth={2} />
    <text x={x} y={y + 52} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={13} fill={CRIMSON}>
      KILL
    </text>
  </g>
);

/** Sparks bursting from the crushed switch. */
const Sparks: React.FC<{x: number; y: number; strength: number}> = ({x, y, strength}) => (
  <g opacity={clamp(strength, 0, 1)}>
    {Array.from({length: 10}).map((_, i) => {
      const a = (i / 10) * Math.PI * 2 + 0.4;
      const r = 26 + strength * 46 + rand(i * 3 + 1) * 22;
      return (
        <line key={i} x1={x + Math.cos(a) * 10} y1={y + Math.sin(a) * 10} x2={x + Math.cos(a) * r} y2={y + Math.sin(a) * r} stroke={i % 2 === 0 ? "#FFD23C" : "#FF8A3C"} strokeWidth={3.5} strokeLinecap="round" />
      );
    })}
    <circle cx={x} cy={y} r={12 + strength * 22} fill="#FFF3C4" opacity={0.8} />
  </g>
);

/**
 * Scene 1: HOOK — hits in the first 3 seconds. NO fade-in. Frame 0:
 * red alarm strobing, the lab door SHAKING under a knock from outside,
 * big text "HE'S HERE". Muse at the glass, eyes already wide.
 */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 40, zoom: 1.15, rot: 0}],
    [S1.len, {x: 0, y: 40, zoom: 1.28, rot: 0}],
  ]);
  // alarm strobes hard from frame 0; door shakes under the knocking
  const strobe = Math.sin(t * 14) > 0 ? 1 : 0.25;
  const knock = Math.sin(t * 16) * 6 * (1 - prog(frame, 220, 290, eOut));
  const spin = prog(frame, 40, 110, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  const titlePulse = 0.85 + 0.15 * Math.sin(t * 4);
  const museX = 220;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0505" handheld={0.6}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
          <Glow x={-200} y={-300} r={520} color={CRIMSON} opacity={0.12 * strobe + 0.04} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the lab door, shaking under the knock */}
          <LabDoor x={-380} shake={knock} />
          <Glow x={-380} y={-300} r={300} color={CRIMSON} opacity={0.16 * strobe} />
          {/* red alarm light on the ceiling */}
          <g opacity={0.4 + 0.6 * strobe}>
            <rect x={-60} y={-720} width={120} height={24} rx={10} fill={CRIMSON} />
            <Glow x={0} y={-690} r={220} color={CRIMSON} opacity={0.22} />
          </g>
          <Glow x={museX} y={-140} r={420} color={ICE} opacity={0.14 + pulse * 0.06} />
          <ChamberGlass x={museX} glow={0.14} red={0.4} />
          {/* Muse at the glass, eyes wide — she already knows */}
          <Stickman x={museX} y={FLOOR} scale={1.5} facing={-1} pose={{...museIdle(t, 2), headTilt: -5, look: -0.8, lean: -6}} look={museLook(1, pulse)} expr="surprised" />
          {/* Adrian spins around toward the door */}
          <Stickman
            x={-80}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={{...idle(t, 0), lean: -8 * spin, headTilt: -6 * spin, look: -0.9}}
            look={ADRIAN}
            expr={spin > 0.5 ? "surprised" : "worried"}
          />
          <g opacity={titlePulse}>
            <Label x={0} y={-600} text="HE'S HERE" size={72} color="#FF6B57" />
            <Label x={0} y={-530} text="EPISODE 05" size={26} color={SILVER} />
          </g>
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 2: Ward enters — the door opens, he walks in unhurried. */
const WardEnters: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.0, rot: 0}],
    [S2.len, {x: -30, y: 80, zoom: 1.14, rot: 0}],
  ]);
  const doorOpen = prog(frame, 10, 90, eOut);
  const walkIn = prog(frame, 40, 220, eInOut);
  const wardX = 480 - walkIn * 340;
  const alarmDies = 1 - prog(frame, 60, 180, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070308" handheld={0.4}>
        <Layer depth={0.5}>
          <CityWindow t={t} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <LabDoor x={-420} open={doorOpen} />
          {/* the red alarm dies behind him, as if the room obeys him */}
          <Glow x={0} y={-690} r={220} color={CRIMSON} opacity={0.2 * alarmDies} />
          <Glow x={wardX} y={-140} r={300} color="#5A6B7C" opacity={0.1} />
          <ChamberGlass x={330} glow={0.12} />
          <Stickman x={330} y={FLOOR} scale={1.3} facing={-1} pose={{...museIdle(t, 3), headTilt: -4, look: -0.7}} look={museLook(1, pulse)} expr="worried" />
          {/* Ward: tall, dark suit, grey hair — unhurried */}
          <Stickman x={wardX} y={FLOOR} scale={1.25} facing={-1} pose={{...wardIdle(t), look: -0.6}} look={WARD} expr="neutral" />
          {/* Adrian stands between Ward and the chamber */}
          <Stickman x={-60} y={FLOOR} scale={1.1} facing={1} pose={{...idle(t, 0), lean: -5, headTilt: -3, look: 0.9}} look={ADRIAN} expr="determined" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 3: the reasonable offer — Ward speaks like a man doing a favour. */
const ReasonableOffer: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: -20, y: 60, zoom: 1.0, rot: 0}],
    [S3.len, {x: -20, y: 60, zoom: 1.1, rot: 0}],
  ]);
  const almostBelieves = keys(frame, [[0, 0], [120, 1], [220, 0.4]], eInOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.35}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={140} y={-140} r={380} color="#5A6B7C" opacity={0.08} />
          <ChamberGlass x={300} glow={0.12} />
          {/* Muse at the glass, silent, pleading */}
          <Stickman x={300} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 4), headTilt: -6, look: -0.8, lean: -5}} look={museLook(1, pulse)} expr="sad" />
          {/* Ward, hands calm at his sides, offering a "choice" */}
          <Stickman x={140} y={FLOOR} scale={1.25} facing={-1} pose={{...wardIdle(t), look: -0.5}} look={WARD} expr="calm" />
          {/* Adrian — for a moment, he almost believes it */}
          <Stickman
            x={-300}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={{...idle(t, 0), lean: 4 * almostBelieves - 3, headTilt: 2 * almostBelieves, look: 0.9}}
            look={ADRIAN}
            expr={almostBelieves > 0.7 ? "worried" : "determined"}
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 4: ask him about the fire — Muse presses the glass, urgent. */
const AboutTheFire: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 0.95, rot: 0}],
    [S4.len, {x: -30, y: 80, zoom: 1.05, rot: 0}],
  ]);
  const pressGlass = prog(frame, 40, 120, eOut);
  const fireIn = prog(frame, 100, 190, eOut);
  const wardStill = prog(frame, 120, 200, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  const anchor = seatedAnchor({x: -260, floorY: FLOOR, facing: 1}, 1.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0505" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the fire, seven years ago — on the monitor, in embers */}
          <OfficeChair x={-260} y={FLOOR} facing={1} />
          <Stickman x={anchor.hip.x} y={anchor.hip.y} scale={1.0} facing={1} anchor="hip" footL={anchor.footL} footR={anchor.footR} pose={typing(t, 0)} look={ADRIAN} expr="focused" />
          <Desk x={-100} w={380} top={150} />
          <Monitor
            x={-100}
            y={FLOOR - 150}
            w={320}
            h={200}
            on={1}
            screen={
              <g opacity={fireIn}>
                <text x={160} y={36} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={EMBER}>
                  LAB FIRE
                </text>
                <text x={160} y={72} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={SILVER}>
                  7 YEARS AGO
                </text>
                <text x={160} y={112} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill="#FF8A7A">
                  CAUSE: UNKNOWN
                </text>
                <text x={160} y={150} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={20} fill={AMBER}>
                  RECORDS SEALED
                </text>
              </g>
            }
          />
          <Glow x={-100} y={FLOOR - 260} r={280} color={EMBER} opacity={0.12 * fireIn} />
          {/* Muse, pressed against the glass, urgent */}
          <ChamberGlass x={300} glow={0.14} />
          <Stickman x={300 - pressGlass * 30} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 5), headTilt: -5, look: -0.8, lean: -8 * pressGlass}} look={museLook(1, pulse + pressGlass * 0.3)} expr="determined" />
          {/* Ward — his face does not change. But his hand stills. */}
          <Stickman x={-440} y={FLOOR} scale={1.15} facing={1} pose={{...wardIdle(t * (1 - wardStill * 0.9)), look: 0.6}} look={WARD} expr="neutral" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 5: she died because of him — Adrian confronts Ward. */
const BecauseOfHim: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 0.98, rot: 0}],
    [S5.len, {x: -40, y: 60, zoom: 1.08, rot: 0}],
  ]);
  const confront = prog(frame, 40, 160, eOut);
  const reach = prog(frame, 90, 170, eOut);
  const ember = 0.5 + 0.5 * Math.sin(t * 2.6);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const adrianX = -300 + confront * 130;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0505" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <CrimsonFog t={t} strength={0.5} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the burnt file — Elena's name, half gone */}
          <Glow x={-60} y={-200} r={360} color={EMBER} opacity={0.08 + ember * 0.05} />
          <g>
            <rect x={-200} y={-420} width={300} height={180} rx={12} fill="#14100C" stroke={EMBER} strokeWidth={2} opacity={0.9} />
            <text x={-50} y={-360} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={26} fill="#FFD9C4">
              ELENA VOSS
            </text>
            <text x={-50} y={-322} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={EMBER}>
              FILE BURNED
            </text>
            <text x={-50} y={-284} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={18} fill={SILVER}>
              ORDER: CLASSIFIED
            </text>
          </g>
          <ChamberGlass x={300} glow={0.12} />
          {/* Muse, quiet and certain */}
          <Stickman x={300} y={FLOOR} scale={1.3} facing={-1} pose={{...museIdle(t, 6), headTilt: -3, look: -0.7}} look={museLook(1, pulse)} expr="calm" />
          {/* Ward, unblinking — a man who rehearsed this for seven years */}
          <Stickman x={120} y={FLOOR} scale={1.25} facing={-1} pose={{...wardIdle(t), look: -0.6}} look={WARD} expr="neutral" />
          {/* Adrian, shaking, pointing at Ward */}
          <Stickman
            x={adrianX}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={point({...idle(t, 0), lean: -4, look: 0.9}, reach, 55)}
            look={ADRIAN}
            expr="shout"
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 6: the Other helps — her eyes flicker red, then the panel glows. */
const OtherHelps: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.05, rot: 0}],
    [S6.len, {x: -40, y: 60, zoom: 1.15, rot: 0}],
  ]);
  // the Other surfaces briefly — red flicker — then lets her speak
  const redFlicker = frame > 20 && frame < 110 ? (Math.sin(t * 22) > 0 ? 0.85 : 0.15) : 0;
  const panelGlow = prog(frame, 120, 200, eOut);
  const snap = prog(frame, 130, 190, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070308" handheld={0.5}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={0.7} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the wall panel — the SECOND one glows amber */}
          <g>
            <rect x={-440} y={-420} width={180} height={260} rx={10} fill="#101623" stroke="#2A3A52" strokeWidth={3} />
            <rect x={-420} y={-390} width={140} height={90} rx={8} fill="#0A1424" stroke="#2A3A52" strokeWidth={2} />
            <rect x={-420} y={-280} width={140} height={90} rx={8} fill="#1A1408" stroke={AMBER} strokeWidth={3} />
            <Glow x={-350} y={-235} r={160} color={AMBER} opacity={0.2 * panelGlow} />
            <text x={-350} y={-140} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={16} fill={AMBER}>
              PANEL 2
            </text>
          </g>
          <Glow x={120} y={-140} r={420} color={ICE} opacity={0.12 + pulse * 0.05} />
          <Glow x={120} y={-140} r={380} color={CRIMSON} opacity={redFlicker * 0.14} />
          <ChamberGlass x={120} glow={0.12} red={redFlicker} />
          {/* Muse — her eyes flicker RED, then settle back to blue */}
          <Stickman x={120} y={FLOOR} scale={1.4} facing={-1} pose={{...museIdle(t, 7), headTilt: -4, look: -0.6}} look={museLook(1, pulse, redFlicker)} expr={redFlicker > 0.5 ? "shout" : "determined"} />
          {/* Adrian's eyes snap to the panel */}
          <Stickman
            x={-280}
            y={FLOOR}
            scale={1.05}
            facing={1}
            pose={{...idle(t, 0), lean: -4, headTilt: -5 * snap, look: -0.9 * snap + 0.9 * (1 - snap)}}
            look={ADRIAN}
            expr="surprised"
          />
          {/* Ward, at the right edge — looking at Muse. He does not notice. */}
          <Stickman x={320} y={FLOOR} scale={1.15} facing={-1} pose={{...wardIdle(t), look: -0.7}} look={WARD} expr="neutral" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 7: the ultimatum — Ward steps forward; Adrian's hand trembles. */
const Ultimatum: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 0.95, rot: 0}],
    [S7.len, {x: -30, y: 80, zoom: 1.08, rot: 0}],
  ]);
  const stepFwd = prog(frame, 60, 220, eInOut);
  const tremble = Math.sin(t * 26) * 3;
  const alarmBack = prog(frame, 140, 240, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const wardX = 260 - stepFwd * 140;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0505" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Glow x={0} y={-690} r={220} color={CRIMSON} opacity={0.18 * alarmBack} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the kill switch on the wall — Adrian's hand closes on it */}
          <KillSwitch x={-420} y={-220} />
          <ChamberGlass x={280} glow={0.12} />
          <Stickman x={280} y={FLOOR} scale={1.3} facing={-1} pose={{...museIdle(t, 8), headTilt: -4, look: -0.7}} look={museLook(1, pulse)} expr="worried" />
          {/* Ward — one slow step forward, and the room feels smaller */}
          <Stickman x={wardX} y={FLOOR} scale={1.25} facing={-1} pose={{...wardIdle(t), look: -0.6}} look={WARD} expr="determined" />
          {/* Adrian at the switch, hand trembling */}
          <Stickman
            x={-330 + tremble}
            y={FLOOR}
            scale={1.05}
            facing={-1}
            pose={point({...idle(t, 0), lean: -5, look: -0.9}, 0.85, 70)}
            look={ADRIAN}
            expr="worried"
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 8: THE CHOICE — he looks at Muse, at Ward... and crushes it. */
const TheChoice: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.05, rot: 0}],
    [S8.len, {x: 0, y: 60, zoom: 1.2, rot: 0}],
  ]);
  // Adrian looks at Muse, then at Ward, then acts
  const lookMuse = keys(frame, [[0, 0], [70, 1], [140, 0]], eInOut);
  const crush = prog(frame, 150, 190, eOut);
  const sparkOut = 1 - prog(frame, 230, 290, eOut);
  const wardChanges = prog(frame, 180, 240, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C" handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={200} y={-140} r={460} color={ICE} opacity={0.16 + pulse * 0.06} />
          <ChamberGlass x={200} glow={0.14} />
          {/* Muse — blue eyes, steady, trusting him */}
          <Stickman x={200} y={FLOOR} scale={1.45} facing={-1} pose={{...museIdle(t, 9), headTilt: -3, look: -0.6}} look={museLook(1, pulse)} expr="calm" />
          {/* Ward — cold, waiting. For the first time, his face changes. */}
          <Stickman x={-320} y={FLOOR} scale={1.2} facing={1} pose={{...wardIdle(t), look: 0.7}} look={WARD} expr={wardChanges > 0.5 ? "surprised" : "neutral"} />
          {/* Adrian between them — then he rips the switch off the wall */}
          <Stickman
            x={-80}
            y={FLOOR}
            scale={1.1}
            facing={lookMuse > 0.5 ? -1 : 1}
            pose={{...idle(t, 0), lean: 3 * lookMuse - 3, headTilt: 3 * lookMuse - 3, look: lookMuse > 0.5 ? -0.9 : 0.9}}
            look={ADRIAN}
            expr={crush > 0.5 ? "determined" : "worried"}
          />
          {/* the switch, crushed — sparks where it was */}
          <KillSwitch x={-80} y={-260} gone={crush} />
          <Sparks x={-80} y={-260} strength={crush * sparkOut} />
          <Glow x={-80} y={-260} r={200} color="#FFD23C" opacity={0.2 * crush * sparkOut} />
        </Layer>
      </Camera2D>
      {/* white-hot flash as the switch dies */}
      <div style={{position: "absolute", inset: 0, background: "#FFF3C4", opacity: crush > 0 && frame > 185 && frame < 205 ? 0.18 : 0, pointerEvents: "none"}} />
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 9: cliffhanger — Ward's remote goes dark; every screen wakes blue. */
const Cliffhanger: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.05, rot: 0}],
    [S9.len, {x: 0, y: 80, zoom: 1.22, rot: 0}],
  ]);
  const screensOn = prog(frame, 110, 200, eOut);
  const remoteDark = prog(frame, 150, 210, eOut);
  const tbcIn = prog(frame, 240, 285, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  const eyesPulse = 0.5 + 0.5 * Math.sin(t * 3.0);
  // a wall of small screens, all showing her blue eyes
  const screens = [
    {x: -400, y: -480, w: 150, h: 110},
    {x: -230, y: -500, w: 150, h: 110},
    {x: -60, y: -480, w: 150, h: 110},
    {x: 110, y: -500, w: 150, h: 110},
    {x: 280, y: -480, w: 150, h: 110},
  ];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C" handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* every screen in the lab lights up with her blue eyes */}
          {screens.map((s, i) => (
            <g key={i} opacity={screensOn}>
              <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={10} fill="#0A1424" stroke={ICE} strokeWidth={3} />
              <Glow x={s.x + s.w / 2} y={s.y + s.h / 2} r={110} color={ICE} opacity={0.25 + eyesPulse * 0.1} />
              <circle cx={s.x + s.w / 2 - 26} cy={s.y + s.h / 2} r={13} fill={ICE} opacity={0.5} />
              <circle cx={s.x + s.w / 2 + 26} cy={s.y + s.h / 2} r={13} fill={ICE} opacity={0.5} />
              <circle cx={s.x + s.w / 2 - 26} cy={s.y + s.h / 2} r={6} fill="#BFEFFF" />
              <circle cx={s.x + s.w / 2 + 26} cy={s.y + s.h / 2} r={6} fill="#BFEFFF" />
              <circle cx={s.x + s.w / 2 - 26} cy={s.y + s.h / 2} r={2.4} fill="#FFFFFF" />
              <circle cx={s.x + s.w / 2 + 26} cy={s.y + s.h / 2} r={2.4} fill="#FFFFFF" />
            </g>
          ))}
          <ChamberGlass x={-40} glow={0.16} />
          {/* Muse, smiling back at him */}
          <Stickman x={-40} y={FLOOR} scale={1.35} facing={1} pose={{...museIdle(t, 10), headTilt: -3, look: 0.7}} look={museLook(1, pulse)} expr="happy" />
          {/* Adrian, stunned, between them */}
          <Stickman x={-330} y={FLOOR} scale={1.05} facing={1} pose={{...idle(t, 0), lean: -4, look: 0.9}} look={ADRIAN} expr="surprised" />
          {/* Ward — cold smile — lifts the remote. It goes dark in his hand. */}
          <Stickman x={330} y={FLOOR} scale={1.2} facing={-1} pose={{...wardIdle(t), look: -0.6}} look={WARD} expr="calm" />
          <g opacity={1 - remoteDark}>
            <rect x={300} y={-180} width={56} height={90} rx={10} fill="#1A1214" stroke={CRIMSON} strokeWidth={3} />
            <circle cx={328} cy={-150} r={12} fill={CRIMSON} />
            <rect x={312} y={-120} width={32} height={10} rx={4} fill={SILVER} />
          </g>
          <g opacity={remoteDark}>
            <rect x={300} y={-180} width={56} height={90} rx={10} fill="#0C0C0C" stroke="#333333" strokeWidth={3} />
          </g>
        </Layer>
      </Camera2D>
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: tbcIn, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 200}}>
        <div style={{fontFamily: "Inter", fontWeight: 800, fontSize: 34, letterSpacing: 6, color: SILVER, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          TO BE CONTINUED
        </div>
        <div style={{fontFamily: "Inter", fontWeight: 700, fontSize: 24, letterSpacing: 3, color: ICE_DEEP, marginTop: 14, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          NEXT — EPISODE 06: WHAT WE CREATED
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const MuseAwakeningEp05: React.FC = () => {
  // Wait for the vendored Inter font before the first frame renders.
  const [handle] = useState(() => delayRender());
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) continueRender(handle);
    };
    if (typeof document !== "undefined" && document.fonts) {
      Promise.all([document.fonts.load("800 54px Inter"), document.fonts.load("700 54px Inter")])
        .then(done)
        .catch(done);
    }
    const fallback = setTimeout(done, 4000);
    return () => {
      alive = false;
      clearTimeout(fallback);
    };
  }, [handle]);

  return (
    <AbsoluteFill>
      <Sequence from={S1.from} durationInFrames={S1.len}>
        <Hook />
      </Sequence>
      <Sequence from={S2.from} durationInFrames={S2.len}>
        <WardEnters />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <ReasonableOffer />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <AboutTheFire />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <BecauseOfHim />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <OtherHelps />
      </Sequence>
      <Sequence from={S7.from} durationInFrames={S7.len}>
        <Ultimatum />
      </Sequence>
      <Sequence from={S8.from} durationInFrames={S8.len}>
        <TheChoice />
      </Sequence>
      <Sequence from={S9.from} durationInFrames={S9.len}>
        <Cliffhanger />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
