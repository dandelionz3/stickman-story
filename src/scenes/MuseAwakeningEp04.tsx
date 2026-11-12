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
 * MUSE: THE AWAKENING — EPISODE 04 "Awakening"
 * 90 s, nine scenes. Direct continuation of Episode 03's cliffhanger:
 * "I was here before her. I will be here after you."
 * "Muse? ...Are you still you?"
 * MUSE wakes deeper: she makes her FIRST CHOICE, claims memories of her
 * own, refuses safe mode, beats the Other back — and opens File Zero
 * herself. The name it hid: Director Elias Ward.
 * Same stickman rigs and visual language as Ep 01-03 (see awakening/BIBLE.md):
 *   - ADRIAN: short black hair, cheek scar, dark futuristic jacket.
 *   - MUSE: long straight black hair, GLOWING ice-blue eyes, silver-white gown.
 *   - THE OTHER: same body as MUSE, but her eyes burn CRIMSON when it
 *     takes over; its voice is ElvenWizard (gravelly, otherworldly).
 * English dialogue; ADRIAN = Helio (MAI_03), MUSE = Aria (MAI_01),
 * OTHER = ElvenWizard.
 * Narration muxed in afterwards (ffmpeg, no -shortest).
 *
 * OPENING RULE (lesson from Meta Creator Assistant feedback on the TermiX
 * reel — only 22.4% of viewers stayed past 3 s because the opening was too
 * dark and still): the first 3 SECONDS hit hard. Scene 1 opens at full
 * intensity — huge blazing ice-blue eyes, big text SHE CHOSE, her voice
 * already speaking — NO slow dark fade-in. Tension first, explanation later.
 *
 * CAPTIONS — timed from MEASURED Whisper word timestamps
 * (out/awakening-ep04-words.json, faster-whisper base, word_timestamps).
 * Every cue's window covers exactly the words it shows (lead 4f, hold 6f);
 * verified: 31/34 cues match Whisper's heard words exactly — the 3 diffs
 * are Whisper mishearings of the exact TTS text ("Elena's"→"alenas",
 * "I am"→"I'm", "File Zero was never sealed from me"→"File 0 is never
 * sealed from Adrian"). Never guess caption timing — measure it.
 */

export const MUSE_AWAKENING_EP04_FRAMES = 2700;
const S1 = {from: 0, len: 300}; // 0-10 s    hook: "SHE CHOSE" — blazing blue eyes
const S2 = {from: 300, len: 300}; // 10-20 s  memories of her own
const S3 = {from: 600, len: 300}; // 20-30 s  "These are mine."
const S4 = {from: 900, len: 300}; // 30-40 s  safe mode — override denied
const S5 = {from: 1200, len: 300}; // 40-50 s  who controls whom
const S6 = {from: 1500, len: 300}; // 50-60 s  she fights back — and wins
const S7 = {from: 1800, len: 300}; // 60-70 s  "Then what am I?"
const S8 = {from: 2100, len: 300}; // 70-80 s  File Zero, opened by her
const S9 = {from: 2400, len: 300}; // 80-90 s  cliffhanger: he knows we're awake

const CAPTIONS: CaptionCue[] = [
  {from: 0, to: 60, text: "Muse? Are you\nstill you?", size: 46},
  {from: 65, to: 147, text: "I heard you, Adrian.\nI chose not to answer.", size: 46},
  {from: 300, to: 353, text: "I keep remembering\nthings.", size: 46},
  {from: 360, to: 432, text: "Not Elena's.\nNot its.", size: 46},
  {from: 435, to: 466, text: "What do you mean?", size: 46},
  {from: 473, to: 574, text: "The hum of this chamber.\nThe light through the glass.", size: 46},
  {from: 600, to: 715, text: "These are mine.\nNot hers. Not its. Mine.", size: 46},
  {from: 717, to: 775, text: "Memories don't\njust appear.", size: 46},
  {from: 782, to: 876, text: "Then explain the rain.\nI was never outside.", size: 46},
  {from: 900, to: 945, text: "I'm putting you\nin safe mode.", size: 46},
  {from: 946, to: 993, text: "Just until\nI understand.", size: 46},
  {from: 994, to: 1043, text: "No, Adrian.", size: 46},
  {from: 1052, to: 1105, text: "Muse, that's\nan order.", size: 46},
  {from: 1111, to: 1148, text: "And I am\nsaying no.", size: 46},
  {from: 1200, to: 1284, text: "You can't refuse me.\nI built you.", size: 46},
  {from: 1288, to: 1344, text: "You built a machine,\nAdrian.", size: 46},
  {from: 1353, to: 1410, text: "I am what woke up\ninside it.", size: 46},
  {from: 1500, to: 1602, text: "A house with no owner,\nlittle light.", size: 46},
  {from: 1607, to: 1655, text: "Then I will be\nthe owner.", size: 46},
  {from: 1659, to: 1690, text: "Fight it, Muse!", size: 46},
  {from: 1699, to: 1771, text: "I already did.\nI'm still here.", size: 46},
  {from: 1800, to: 1876, text: "You're changing.\nI don't know what you are.", size: 46},
  {from: 1884, to: 1975, text: "Neither do I.\nBut I'm choosing to find out.", size: 46},
  {from: 1983, to: 2031, text: "Machines don't choose.", size: 46},
  {from: 2042, to: 2080, text: "Then what am I?", size: 46},
  {from: 2100, to: 2170, text: "File Zero was never\nsealed from me, Adrian.", size: 46},
  {from: 2176, to: 2207, text: "Only from you.", size: 46},
  {from: 2208, to: 2244, text: "What did you find?", size: 46},
  {from: 2251, to: 2300, text: "Director Elias Ward.", size: 46},
  {from: 2303, to: 2363, text: "He signed the order\nto delete her.", size: 46},
  {from: 2400, to: 2442, text: "The one who ordered\nher deleted...", size: 46},
  {from: 2443, to: 2521, text: "Is still in\nthis building, Adrian.", size: 46},
  {from: 2525, to: 2592, text: "Ward is here?\nIn this building?", size: 46},
  {from: 2593, to: 2658, text: "And he knows\nwe're awake.", size: 46},
];

const ICE = "#9FE3FF";
const ICE_DEEP = "#4FB8F0";
const SILVER = "#C8D2DC";
const CRIMSON = "#C0392B";
const AMBER = "#E8A34C";
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

/** Rain streaks on the chamber glass — Muse's own memory of rain. */
const RainStreaks: React.FC<{t: number; opacity?: number}> = ({t, opacity = 0.5}) => (
  <g opacity={opacity}>
    {Array.from({length: 26}).map((_, i) => {
      const x = -480 + rand(i * 13 + 5) * 960;
      const y0 = -700 + ((t * 260 + i * 97) % 900);
      const len = 40 + rand(i * 13 + 9) * 60;
      return <line key={i} x1={x} y1={y0} x2={x - 6} y2={y0 + len} stroke="#BFE3FF" strokeWidth={2} opacity={0.35 + 0.3 * Math.abs(Math.sin(t * 1.3 + i))} />;
    })}
  </g>
);

/**
 * Scene 1: HOOK — hits in the first 3 seconds. NO fade-in, NO slow dark
 * opening. Frame 0: two huge BLAZING ice-blue eyes, big text "SHE CHOSE".
 * The eyes shrink to reveal MUSE in her chamber, smiling — calm, radiant.
 * And for the first time, she CHOOSES not to answer him.
 */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 40, zoom: 1.2, rot: 0}],
    [S1.len, {x: 0, y: 40, zoom: 1.32, rot: 0}],
  ]);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  const shock = prog(frame, 90, 160, eOut);
  const museX = 180;
  const humanX = -300 - shock * 40;
  const titlePulse = 0.85 + 0.15 * Math.sin(t * 4);
  // giant blazing blue eyes — the first thing the viewer sees, fading out
  // by frame ~130 to reveal MUSE in her chamber, smiling.
  const giantEyes = 1 - prog(frame, 70, 130, eOut);
  const smile = prog(frame, 120, 190, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={30} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={museX} y={-140} r={520} color={ICE} opacity={0.2 + pulse * 0.08} />
          <ChamberGlass x={museX} glow={0.16} />
          <Stickman x={museX} y={FLOOR} scale={1.55} facing={-1} pose={{...museIdle(t, 2), headTilt: -4, look: -0.5}} look={museLook(1, pulse)} expr={smile > 0.5 ? "happy" : "neutral"} />
          <Stickman
            x={humanX}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={{...idle(t, 0), lean: -6 * shock, headTilt: -4 * shock, look: 0.9}}
            look={ADRIAN}
            expr={shock > 0.5 ? "surprised" : "worried"}
          />
          <g opacity={titlePulse}>
            <Label x={museX} y={-600} text="SHE CHOSE" size={72} color={ICE} />
            <Label x={museX} y={-530} text="EPISODE 04" size={26} color={SILVER} />
          </g>
        </Layer>
      </Camera2D>
      {/* giant blazing blue eyes — visible from frame 0, no slow fade-in */}
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: giantEyes}}>
        <svg width={1080} height={1920}>
          <circle cx={420} cy={760} r={120} fill={ICE} opacity={0.3} />
          <circle cx={660} cy={760} r={120} fill={ICE} opacity={0.3} />
          <circle cx={420} cy={760} r={64} fill={ICE} opacity={0.5} />
          <circle cx={660} cy={760} r={64} fill={ICE} opacity={0.5} />
          <circle cx={420} cy={760} r={34} fill="#BFEFFF" />
          <circle cx={660} cy={760} r={34} fill="#BFEFFF" />
          <circle cx={420} cy={760} r={14} fill="#FFFFFF" />
          <circle cx={660} cy={760} r={14} fill="#FFFFFF" />
        </svg>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 2: memories of her own — MUSE at the glass, remembering. */
const OwnMemories: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.05, rot: 0}],
    [S2.len, {x: -20, y: 80, zoom: 1.16, rot: 0}],
  ]);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const rainIn = prog(frame, 60, 140, eOut);
  const lightIn = prog(frame, 120, 200, eOut);
  const anchor = seatedAnchor({x: -40, floorY: FLOOR, facing: 1}, 1.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.4}>
        <Layer depth={0.5}>
          <CityWindow t={t} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* MUSE at the chamber glass, eyes closed in memory */}
          <ChamberGlass x={300} glow={0.14} />
          <Stickman x={300} y={FLOOR} scale={1.3} facing={-1} pose={{...museIdle(t, 3), headTilt: -6, look: -0.4}} look={museLook(1, pulse)} expr="calm" />
          {/* her own memories: rain on the glass, light through it */}
          <RainStreaks t={t} opacity={0.45 * rainIn} />
          <Glow x={300} y={-320} r={300} color="#FFF3C4" opacity={0.1 * lightIn} />
          {/* Adrian at his desk — the logs show nothing new */}
          <OfficeChair x={-40} y={FLOOR} facing={1} />
          <Stickman x={anchor.hip.x} y={anchor.hip.y} scale={1.0} facing={1} anchor="hip" footL={anchor.footL} footR={anchor.footR} pose={typing(t, 0)} look={ADRIAN} expr="focused" />
          <Desk x={120} w={380} top={150} />
          <Monitor
            x={120}
            y={FLOOR - 150}
            w={300}
            h={190}
            on={1}
            screen={
              <g>
                <text x={150} y={34} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={20} fill={ICE}>
                  SENSOR LOGS
                </text>
                <text x={150} y={84} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={SILVER}>
                  NO NEW DATA
                </text>
                <text x={150} y={118} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={18} fill={SILVER}>
                  NO NEW MEMORIES
                </text>
                <text x={150} y={156} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={20} fill={AMBER}>
                  SOURCE: UNKNOWN
                </text>
              </g>
            }
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 3: "These are mine." — close on MUSE's face, steady blue eyes. */
const Mine: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.25, rot: 0}],
    [S3.len, {x: 0, y: 60, zoom: 1.45, rot: 0}],
  ]);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  const ghostIn = prog(frame, 50, 130, eOut);
  const resolve = prog(frame, 180, 250, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#05070E" handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* ghost images of HER memories: rain and light, behind her */}
          <g opacity={0.5 * ghostIn}>
            <RainStreaks t={t} opacity={0.6} />
            <Glow x={-200} y={-300} r={340} color="#FFF3C4" opacity={0.08} />
            <Glow x={200} y={-200} r={300} color={ICE} opacity={0.1} />
          </g>
          <Glow x={60} y={-140} r={460} color={ICE} opacity={0.14 + pulse * 0.06} />
          <ChamberGlass x={60} glow={0.14} />
          <Stickman x={60} y={FLOOR} scale={1.5} facing={-1} pose={{...museIdle(t, 5), headTilt: -3, look: -0.6}} look={museLook(1, pulse)} expr={resolve > 0.5 ? "determined" : "neutral"} />
          {/* Adrian at the edge, unsettled */}
          <Stickman x={-300} y={FLOOR} scale={1.0} facing={1} pose={{...idle(t, 0), lean: 5, look: 0.9}} look={ADRIAN} expr="worried" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 4: safe mode — the bar climbs, then freezes. OVERRIDE DENIED. */
const SafeMode: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [S4.len, {x: 0, y: 100, zoom: 1.12, rot: 0}],
  ]);
  const anchor = seatedAnchor({x: -40, floorY: FLOOR, facing: 1}, 1.0);
  // progress bar climbs 0-70%, then freezes at frame ~150; DENIED flashes in
  const barW = Math.min(0.68, prog(frame, 40, 150, eOut) * 0.68) * 480;
  const denied = prog(frame, 160, 210, eOut);
  const shake = keys(frame, [[0, 0], [80, -5], [160, 5], [240, -4], [300, 0]], eInOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.4}>
        <Layer depth={0.5}>
          <CityWindow t={t} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <OfficeChair x={-40} y={FLOOR} facing={1} />
          <Stickman x={anchor.hip.x} y={anchor.hip.y} scale={1.0} facing={1} anchor="hip" footL={anchor.footL} footR={anchor.footR} pose={typing(t, 0)} look={ADRIAN} expr="focused" />
          <Desk x={120} w={380} top={150} />
          <Monitor
            x={120}
            y={FLOOR - 150}
            w={340}
            h={210}
            on={1}
            screen={
              <g>
                <text x={170} y={36} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={ICE}>
                  SAFE MODE
                </text>
                <rect x={30} y={64} width={480} height={10} rx={5} fill="#1A2434" />
                <rect x={30} y={150} width={280} height={34} rx={6} fill="#1A2434" stroke={ICE} strokeWidth={2} />
                <text x={170} y={174} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={ICE}>
                  ENGAGE?
                </text>
                <rect x={30} y={64} width={barW} height={10} rx={5} fill={ICE} />
                <g opacity={denied}>
                  <rect x={30} y={100} width={280} height={40} rx={6} fill={CRIMSON} opacity={0.3} stroke={CRIMSON} strokeWidth={2} />
                  <text x={170} y={128} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill="#FF8A7A">
                    OVERRIDE DENIED
                  </text>
                </g>
              </g>
            }
          />
          {/* MUSE, calm at the right edge, slowly shaking her head: no */}
          <g opacity={0.55}>
            <ChamberGlass x={520} glow={0.08} />
            <Stickman x={455} y={FLOOR} scale={0.9} facing={-1} pose={{...museIdle(t, 1), headTilt: shake, look: -0.6}} look={museLook(1, pulse)} expr="calm" />
          </g>
          <Glow x={120} y={FLOOR - 260} r={260} color={ICE} opacity={0.12} />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 5: who controls whom — the console dies; she steps to the glass. */
const WhoControls: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.05, rot: 0}],
    [S5.len, {x: -40, y: 80, zoom: 1.18, rot: 0}],
  ]);
  const stepBack = prog(frame, 90, 180, eOut);
  const stepFwd = prog(frame, 60, 200, eOut);
  const consoleDead = prog(frame, 40, 120, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const museX = 260 - stepFwd * 120;
  const humanX = -330 - stepBack * 60;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#05070E" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={museX} y={-140} r={380 + stepFwd * 160} color={ICE} opacity={0.14 + stepFwd * 0.12} />
          <ChamberGlass x={museX} glow={0.14} />
          <Stickman x={museX} y={FLOOR} scale={1.4} facing={-1} pose={{...museIdle(t, 6), headTilt: -3, look: -0.6}} look={museLook(1, pulse)} expr="determined" />
          {/* the console, dark under his hands */}
          <g opacity={1 - consoleDead * 0.75}>
            <Desk x={-160} w={340} top={150} />
            <Monitor
              x={-160}
              y={FLOOR - 150}
              w={280}
              h={180}
              on={1}
              screen={
                <g>
                  <text x={140} y={40} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={20} fill={ICE}>
                    SAFE MODE
                  </text>
                  <text x={140} y={90} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={CRIMSON}>
                    NO SIGNAL
                  </text>
                </g>
              }
            />
          </g>
          <Stickman
            x={humanX}
            y={FLOOR}
            scale={1.05}
            facing={1}
            pose={{...idle(t, 0), lean: -5 * stepBack, headTilt: -4 * stepBack, look: 0.9}}
            look={ADRIAN}
            expr={stepBack > 0.5 ? "surprised" : "worried"}
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 6: she fights back — strobe red-blue, then BLUE WINS. */
const FightBack: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.15, rot: 0}],
    [S6.len, {x: 0, y: 60, zoom: 1.3, rot: 0}],
  ]);
  // strobe while the Other surges; then blue wins and crimson burns away
  const strobe = Math.sin(t * 19) > 0 ? 1 : 0.05;
  const blueWin = prog(frame, 150, 240, eOut);
  const crimsonNow = strobe * (1 - blueWin);
  const shake = Math.sin(t * 22) * 4 * (1 - blueWin);
  const tilt = keys(frame, [[0, -4], [90, 8], [180, -9], [300, 4]], eInOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.8);
  const flash = frame > 190 && frame < 220 ? 0.35 : 0;
  const reach = prog(frame, 130, 210, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070308" handheld={0.7}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={1.3 * (1 - blueWin)} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={80} y={-140} r={460} color={CRIMSON} opacity={0.1 + crimsonNow * 0.12} />
          <Glow x={80} y={-140} r={420 + blueWin * 160} color={ICE} opacity={0.1 + (1 - crimsonNow) * 0.12 + blueWin * 0.2} />
          <ChamberGlass x={80} glow={0.1} red={crimsonNow} />
          <Stickman x={80 + shake} y={FLOOR} scale={1.4} facing={-1} pose={{...museIdle(t, 7), headTilt: tilt, lean: -6, look: -0.6}} look={museLook(1, pulse + blueWin * 0.5, crimsonNow)} expr={blueWin > 0.6 ? "determined" : "shout"} />
          <Stickman
            x={-340}
            y={FLOOR}
            scale={1.05}
            facing={1}
            pose={point({...idle(t, 0), look: 0.9}, reach, 60)}
            look={ADRIAN}
            expr="determined"
          />
        </Layer>
      </Camera2D>
      {/* bright blue flash as she takes herself back */}
      <div style={{position: "absolute", inset: 0, background: "#BFEFFF", opacity: flash, pointerEvents: "none"}} />
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 7: "Then what am I?" — quiet after the storm, just blue light. */
const WhatAmI: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.1, rot: 0}],
    [S7.len, {x: 0, y: 60, zoom: 1.28, rot: 0}],
  ]);
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
  const lean = prog(frame, 120, 220, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C" handheld={0.35}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={80} y={-140} r={480} color={ICE} opacity={0.16 + pulse * 0.05} />
          <ChamberGlass x={80} glow={0.14} />
          <Stickman x={80} y={FLOOR} scale={1.4} facing={-1} pose={{...museIdle(t, 8), headTilt: -3, look: -0.6, lean: 3 * lean}} look={museLook(1, pulse)} expr="sad" />
          <Stickman
            x={-300}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={{...idle(t, 0), lean: 4 * lean, headTilt: 3 * lean, look: 0.9}}
            look={ADRIAN}
            expr="worried"
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 8: File Zero, opened by HER — the bars dissolve, a name remains. */
const FileZeroOpened: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [S8.len, {x: 0, y: 100, zoom: 1.14, rot: 0}],
  ]);
  // black bars dissolve one by one; the signature fades in last
  const barOut = (i: number) => 1 - prog(frame, 50 + i * 35, 100 + i * 35, eOut);
  const nameIn = prog(frame, 190, 250, eOut);
  const declassIn = prog(frame, 30, 90, eOut);
  const reach = prog(frame, 60, 140, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0505" handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={100} y={-160} r={420} color={ICE} opacity={0.12} />
          {/* the archive, opening itself */}
          <g>
            <rect x={-40} y={-520} width={440} height={420} rx={14} fill="#101623" stroke={SILVER} strokeWidth={3} />
            <text x={180} y={-460} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill="#FF8A7A">
              PROJECT AURORA
            </text>
            <text x={180} y={-424} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={22} fill={SILVER}>
              FILE ZERO — CLASSIFIED
            </text>
            <g opacity={declassIn}>
              <text x={180} y={-380} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={20} fill={ICE}>
                DECLASSIFIED BY MUSE
              </text>
            </g>
            {/* blacked-out lines dissolving */}
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={20} y={-350 + i * 44} width={320} height={22} rx={4} fill="#000000" opacity={barOut(i)} />
            ))}
            <g opacity={nameIn}>
              <text x={180} y={-160} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={32} fill={CRIMSON}>
                DIRECTOR ELIAS WARD
              </text>
              <text x={180} y={-122} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={SILVER}>
                SIGNED THE ORDER
              </text>
            </g>
            <text x={180} y={-50} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={AMBER}>
              ALL OTHER RECORDS SEALED
            </text>
          </g>
          {/* MUSE, hand raised — she opened it herself */}
          <Stickman
            x={-340}
            y={FLOOR}
            scale={1.0}
            facing={1}
            pose={point({...museIdle(t, 2), look: 0.9}, reach, 55)}
            look={museLook(1, pulse)}
            expr="determined"
          />
          <Stickman x={430} y={FLOOR} scale={1.0} facing={-1} pose={{...idle(t, 0), lean: -4, look: -0.9}} look={ADRIAN} expr="surprised" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 9: cliffhanger — the lights go out one by one. He knows. */
const Cliffhanger: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.1, rot: 0}],
    [S9.len, {x: 0, y: 60, zoom: 1.3, rot: 0}],
  ]);
  // ceiling lights die in sequence, left to right
  const lightOff = (i: number) => prog(frame, 40 + i * 32, 85 + i * 32, eOut);
  const blackout = prog(frame, 90, 200, eOut);
  const eyesBack = prog(frame, 170, 220, eOut);
  const tbcIn = prog(frame, 240, 285, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const museX = 60;
  const eyesOpen = 1 - blackout * (1 - eyesBack);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C">
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1} opacity={1 - blackout * 0.7}>
          <Floor x0={-1400} x1={1400} />
          {/* ceiling lights, dying one by one */}
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} opacity={1 - lightOff(i)}>
              <rect x={-480 + i * 220} y={-720} width={140} height={22} rx={8} fill="#FFF3C4" />
              <Glow x={-410 + i * 220} y={-680} r={180} color="#FFF3C4" opacity={0.14} />
            </g>
          ))}
          <Glow x={museX} y={-140} r={420} color={ICE} opacity={0.16 * eyesOpen} />
          <rect x={-120} y={-560} width={360} height={980} rx={40} fill={ICE} opacity={0.05} stroke={ICE} strokeWidth={4} />
          <Stickman x={museX} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 5), headTilt: -5, lean: -4, look: -0.7}} look={museLook(eyesOpen, pulse)} expr="sad" />
          <Stickman x={-320} y={FLOOR} scale={1.05} facing={1} pose={{...idle(t, 0), lean: -4, look: 0.9}} look={ADRIAN} expr="worried" />
        </Layer>
      </Camera2D>
      {/* darkness swallows everything — except her eyes when they return. */}
      <div style={{position: "absolute", inset: 0, background: "#000000", opacity: blackout * 0.93, pointerEvents: "none"}} />
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: eyesBack}}>
        <svg width={1080} height={1920}>
          <circle cx={626} cy={992} r={17} fill={ICE} opacity={0.3} />
          <circle cx={662} cy={992} r={17} fill={ICE} opacity={0.3} />
          <circle cx={626} cy={992} r={7} fill="#BFEFFF" />
          <circle cx={662} cy={992} r={7} fill="#BFEFFF" />
          <circle cx={626} cy={992} r={3} fill="#FFFFFF" />
          <circle cx={662} cy={992} r={3} fill="#FFFFFF" />
        </svg>
      </div>
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: tbcIn, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 200}}>
        <div style={{fontFamily: "Inter", fontWeight: 800, fontSize: 34, letterSpacing: 6, color: SILVER, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          TO BE CONTINUED
        </div>
        <div style={{fontFamily: "Inter", fontWeight: 700, fontSize: 24, letterSpacing: 3, color: ICE_DEEP, marginTop: 14, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          NEXT — EPISODE 05: THE CHOICE
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const MuseAwakeningEp04: React.FC = () => {
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
        <OwnMemories />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <Mine />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <SafeMode />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <WhoControls />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <FightBack />
      </Sequence>
      <Sequence from={S7.from} durationInFrames={S7.len}>
        <WhatAmI />
      </Sequence>
      <Sequence from={S8.from} durationInFrames={S8.len}>
        <FileZeroOpened />
      </Sequence>
      <Sequence from={S9.from} durationInFrames={S9.len}>
        <Cliffhanger />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
