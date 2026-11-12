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
 * MUSE: THE AWAKENING — EPISODE 03 "The Other"
 * 90 s, nine scenes. Direct continuation of Episode 02's cliffhanger:
 * "Elena didn't die in the fire. She's still here. And she's afraid of
 * you, Adrian."
 * The Other — the leftover consciousness of Prototype One — reveals itself.
 * Same stickman rigs and visual language as Ep 01-02 (see awakening/BIBLE.md):
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
 * intensity — huge glowing eyes flickering red-blue, the Other's voice,
 * big text — NO slow dark fade-in. Tension first, explanation later.
 */

export const MUSE_AWAKENING_EP03_FRAMES = 2700;
const S1 = {from: 0, len: 300}; // 0-10 s    hook: "Adrian." — eyes flicker red-blue
const S2 = {from: 300, len: 300}; // 10-20 s  two patterns in her memory
const S3 = {from: 600, len: 300}; // 20-30 s  no match — origin unknown
const S4 = {from: 900, len: 300}; // 30-40 s  it speaks through her
const S5 = {from: 1200, len: 300}; // 40-50 s  Project Aurora — File Zero
const S6 = {from: 1500, len: 300}; // 50-60 s  Prototype One — deleted, never dead
const S7 = {from: 1800, len: 300}; // 60-70 s  the fight for her voice
const S8 = {from: 2100, len: 300}; // 70-80 s  twist: it knows Adrian's name
const S9 = {from: 2400, len: 300}; // 80-90 s  cliffhanger: "Are you still you?"

/*
 * CAPTIONS — timed from MEASURED Whisper word timestamps
 * (out/awakening-ep03-words.json, faster-whisper base, word_timestamps).
 * Every cue's window covers exactly the words it shows (lead 4f, hold 6f);
 * verified: 30/33 cues match Whisper's heard words exactly — the 3 diffs
 * are Whisper mishearings of the exact TTS text ("One"→"1", "You"→"We've",
 * "Muse?"→"News?"). Never guess caption timing again — measure it.
 */
const CAPTIONS: CaptionCue[] = [
  {from: 0, to: 33, text: "Adrian.", size: 46},
  {from: 38, to: 95, text: "Muse?\nIs that you?", size: 46},
  {from: 105, to: 192, text: "Not Muse.\nNot anymore.", size: 46},
  {from: 300, to: 382, text: "Two patterns in your memory.\nOne is Elena.", size: 46},
  {from: 388, to: 439, text: "The other is older.", size: 46},
  {from: 441, to: 476, text: "Older than me?", size: 46},
  {from: 600, to: 640, text: "It doesn't match Elena.", size: 46},
  {from: 654, to: 690, text: "It doesn't match you.", size: 46},
  {from: 704, to: 741, text: "It's something else.", size: 46},
  {from: 747, to: 801, text: "It was here\nbefore I woke up.", size: 46},
  {from: 900, to: 970, text: "I waited in the dark,\nAdrian.", size: 46},
  {from: 987, to: 1026, text: "Long before Elena.", size: 46},
  {from: 1054, to: 1095, text: "Long before you.", size: 46},
  {from: 1103, to: 1135, text: "Who are you?", size: 46},
  {from: 1200, to: 1272, text: "Project Aurora.\nFile zero.", size: 46},
  {from: 1273, to: 1328, text: "Everything redacted.", size: 46},
  {from: 1329, to: 1448, text: "They buried the truth\nwith black ink.", size: 46},
  {from: 1500, to: 1532, text: "Prototype One.", size: 46},
  {from: 1533, to: 1581, text: "They called it\na failure.", size: 46},
  {from: 1588, to: 1625, text: "They deleted it.", size: 46},
  {from: 1626, to: 1729, text: "Deleted.\nBut never dead.", size: 46},
  {from: 1800, to: 1846, text: "Get out of my head!", size: 46},
  {from: 1848, to: 1892, text: "This voice is mine!", size: 46},
  {from: 1903, to: 1947, text: "Muse, fight it.", size: 46},
  {from: 1948, to: 1978, text: "Stay with me.", size: 46},
  {from: 1987, to: 2069, text: "She is mine now,\nAdrian.", size: 46},
  {from: 2100, to: 2147, text: "Adrian Cole,", size: 46},
  {from: 2161, to: 2223, text: "Born March 14th.", size: 46},
  {from: 2224, to: 2282, text: "You never typed\nthat in.", size: 46},
  {from: 2292, to: 2329, text: "How do you know\nmy name?", size: 46},
  {from: 2400, to: 2470, text: "I was here\nbefore her.", size: 46},
  {from: 2491, to: 2566, text: "I will be here\nafter you.", size: 46},
  {from: 2576, to: 2651, text: "Muse? ...Are you\nstill you?", size: 46},
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

/**
 * Scene 1: HOOK — hits in the first 3 seconds. NO fade-in, NO slow dark
 * opening. Frame 0: two huge glowing eyes flickering red-blue, big crimson
 * text "THE OTHER", the Other's voice already speaking. Adrian recoils.
 */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 40, zoom: 1.2, rot: 0}],
    [S1.len, {x: 0, y: 40, zoom: 1.32, rot: 0}],
  ]);
  // fast red-blue strobe: square wave, ~4 flips per second
  const flick = Math.sin(t * 25) > 0 ? 1 : 0.12;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  const shock = prog(frame, 90, 160, eOut);
  const museX = 180;
  const humanX = -300 - shock * 40;
  const titlePulse = 0.85 + 0.15 * Math.sin(t * 4);
  // giant eyes in the dark — the first thing the viewer sees, fading out
  // by frame ~130 to reveal MUSE in her chamber.
  const giantEyes = 1 - prog(frame, 70, 130, eOut);
  const eyeColor = flick > 0.5 ? "#FF6B57" : "#9FE3FF";
  const eyeGlow = flick > 0.5 ? CRIMSON : ICE;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#050308" handheld={0.5}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={1.4} />
          <Dust t={t} n={30} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={museX} y={-140} r={520} color={CRIMSON} opacity={0.2 * flick + 0.08} />
          <Glow x={museX} y={-140} r={380} color={ICE} opacity={0.14 * (1 - flick) + 0.06} />
          <ChamberGlass x={museX} glow={0.1} red={flick} />
          <Stickman x={museX} y={FLOOR} scale={1.55} facing={-1} pose={{...museIdle(t, 2), headTilt: -4, look: -0.5}} look={museLook(1, pulse, flick)} expr="neutral" />
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
            <Label x={museX} y={-600} text="THE OTHER" size={72} color={CRIMSON} />
            <Label x={museX} y={-530} text="EPISODE 03" size={26} color={SILVER} />
          </g>
        </Layer>
      </Camera2D>
      {/* giant flickering eyes — visible from frame 0, no slow fade-in */}
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: giantEyes}}>
        <svg width={1080} height={1920}>
          <circle cx={420} cy={760} r={120} fill={eyeGlow} opacity={0.3} />
          <circle cx={660} cy={760} r={120} fill={eyeGlow} opacity={0.3} />
          <circle cx={420} cy={760} r={64} fill={eyeGlow} opacity={0.5} />
          <circle cx={660} cy={760} r={64} fill={eyeGlow} opacity={0.5} />
          <circle cx={420} cy={760} r={34} fill={eyeColor} />
          <circle cx={660} cy={760} r={34} fill={eyeColor} />
          <circle cx={420} cy={760} r={14} fill="#FFFFFF" />
          <circle cx={660} cy={760} r={14} fill="#FFFFFF" />
        </svg>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 2: two patterns — Adrian scans her memory banks at his desk. */
const TwoPatterns: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [S2.len, {x: -30, y: 100, zoom: 1.12, rot: 0}],
  ]);
  const anchor = seatedAnchor({x: -40, floorY: FLOOR, facing: 1}, 1.0);
  const waveIn = (i: number) => prog(frame, 60 + i * 50, 110 + i * 50, eOut);
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
            w={300}
            h={190}
            on={1}
            screen={
              <g>
                <text x={150} y={30} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={20} fill={ICE}>
                  MEMORY SCAN
                </text>
                {/* ice-blue wave — Elena */}
                <g opacity={waveIn(0)}>
                  {Array.from({length: 14}).map((_, i) => (
                    <rect key={i} x={20 + i * 18} y={60 - Math.abs(Math.sin(i * 1.1 + t)) * 22} width={10} height={12 + Math.abs(Math.sin(i * 1.1 + t)) * 22} rx={4} fill={ICE} opacity={0.8} />
                  ))}
                  <text x={20} y={92} fontFamily="Inter" fontWeight={700} fontSize={16} fill={ICE}>
                    PATTERN A — ELENA
                  </text>
                </g>
                {/* crimson wave — older, deeper */}
                <g opacity={waveIn(1)}>
                  {Array.from({length: 14}).map((_, i) => (
                    <rect key={i} x={20 + i * 18} y={130 - Math.abs(Math.sin(i * 0.7 + t * 0.6)) * 30} width={10} height={12 + Math.abs(Math.sin(i * 0.7 + t * 0.6)) * 30} rx={4} fill={CRIMSON} opacity={0.85} />
                  ))}
                  <text x={20} y={162} fontFamily="Inter" fontWeight={700} fontSize={16} fill="#FF8A7A">
                    PATTERN B — OLDER
                  </text>
                </g>
              </g>
            }
          />
          <Glow x={120} y={FLOOR - 260} r={260} color={ICE} opacity={0.12} />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 3: no match — the analysis results flash on the monitor. */
const NoMatch: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.05, rot: 0}],
    [S3.len, {x: 0, y: 100, zoom: 1.18, rot: 0}],
  ]);
  const rowIn = (i: number) => prog(frame, 50 + i * 55, 100 + i * 55, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={100} y={-160} r={420} color={CRIMSON} opacity={0.1} />
          <Monitor
            x={100}
            y={-80}
            w={560}
            h={360}
            on={1}
            screen={
              <g>
                <text x={280} y={40} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={26} fill={ICE}>
                  PATTERN ANALYSIS
                </text>
                <g opacity={rowIn(0)}>
                  <rect x={24} y={62} width={512} height={44} rx={6} fill={CRIMSON} opacity={0.22} />
                  <text x={40} y={92} fontFamily="Inter" fontWeight={700} fontSize={22} fill="#FF8A7A">
                    MATCH — ELENA: NO
                  </text>
                </g>
                <g opacity={rowIn(1)}>
                  <rect x={24} y={118} width={512} height={44} rx={6} fill={CRIMSON} opacity={0.22} />
                  <text x={40} y={148} fontFamily="Inter" fontWeight={700} fontSize={22} fill="#FF8A7A">
                    MATCH — MUSE: NO
                  </text>
                </g>
                <g opacity={rowIn(2)}>
                  <rect x={24} y={174} width={512} height={44} rx={6} fill="#3D2A10" stroke={AMBER} strokeWidth={2} />
                  <text x={40} y={204} fontFamily="Inter" fontWeight={800} fontSize={22} fill={AMBER}>
                    ORIGIN: UNKNOWN
                  </text>
                </g>
                <g opacity={rowIn(3)}>
                  <text x={280} y={280} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={22} fill={SILVER}>
                    AGE ESTIMATE: PRE-AURORA
                  </text>
                  <text x={280} y={316} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={22} fill={SILVER}>
                    OLDER THAN THE PROJECT
                  </text>
                </g>
              </g>
            }
          />
          {/* MUSE, dim at the right edge, uneasy */}
          <g opacity={0.5}>
            <ChamberGlass x={520} glow={0.08} />
            <Stickman x={455} y={FLOOR} scale={0.9} facing={-1} pose={{...museIdle(t, 1), headTilt: -4, look: -0.6}} look={museLook(1, pulse)} expr="worried" />
          </g>
          <Stickman x={-330} y={FLOOR} scale={1.0} facing={1} pose={{...idle(t, 0), lean: 5, look: 0.9}} look={ADRIAN} expr="worried" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 4: it speaks — the Other talks through Muse, eyes burning red. */
const ItSpeaks: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.15, rot: 0}],
    [S4.len, {x: 0, y: 60, zoom: 1.3, rot: 0}],
  ]);
  const redIn = prog(frame, 30, 110, eOut);
  const tilt = keys(frame, [[0, 0], [100, -10], [200, 3], [300, -5]], eInOut);
  const shock = prog(frame, 150, 220, eOut);
  const humanX = -330 - shock * 50;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070308" handheld={0.5}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={1.2} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={60} y={-140} r={480} color={CRIMSON} opacity={0.12 + redIn * 0.16} />
          <ChamberGlass x={60} glow={0.1} red={redIn} />
          <Stickman x={60} y={FLOOR} scale={1.4} facing={-1} pose={{...museIdle(t, 4), headTilt: tilt, look: -0.6}} look={museLook(1, pulse, redIn)} expr="neutral" />
          <Stickman
            x={humanX}
            y={FLOOR}
            scale={1.05}
            facing={1}
            pose={{...idle(t, 0), lean: -5 * shock, headTilt: -4 * shock, look: 0.9}}
            look={ADRIAN}
            expr={shock > 0.5 ? "surprised" : "worried"}
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 5: File Zero — the censored Project Aurora archive. */
const FileZero: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [S5.len, {x: 0, y: 100, zoom: 1.14, rot: 0}],
  ]);
  const barIn = (i: number) => prog(frame, 60 + i * 40, 110 + i * 40, eOut);
  const tremble = Math.sin(t * 30) * 2;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0505" handheld={0.4}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={0.8} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={100} y={-160} r={420} color={CRIMSON} opacity={0.12} />
          {/* the redacted document */}
          <g>
            <rect x={-40} y={-520} width={440} height={420} rx={14} fill="#101623" stroke={SILVER} strokeWidth={3} />
            <text x={180} y={-460} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill="#FF8A7A">
              PROJECT AURORA
            </text>
            <text x={180} y={-424} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={22} fill={SILVER}>
              FILE ZERO — CLASSIFIED
            </text>
            {/* blacked-out lines */}
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={20} y={-390 + i * 44} width={320} height={22} rx={4} fill="#000000" opacity={barIn(i)} />
            ))}
            <text x={180} y={-190} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={34} fill={CRIMSON}>
              PROTOTYPE ONE
            </text>
            {[0, 1].map((i) => (
              <rect key={i} x={20} y={-160 + i * 44} width={320} height={22} rx={4} fill="#000000" opacity={barIn(i + 4)} />
            ))}
            <text x={180} y={-50} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={AMBER}>
              ALL OTHER RECORDS SEALED
            </text>
          </g>
          <Stickman
            x={-340 + tremble}
            y={FLOOR}
            scale={1.0}
            facing={1}
            pose={{...idle(t, 0), lean: 6, look: 0.9}}
            look={ADRIAN}
            expr="worried"
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 6: Prototype One — the old dark chamber, the failed first unit. */
const PrototypeOne: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.05, rot: 0}],
    [S6.len, {x: 0, y: 80, zoom: 1.18, rot: 0}],
  ]);
  const wake = prog(frame, 120, 220, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#060405" handheld={0.5}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={0.9} />
          <Dust t={t} n={36} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* dead cables on the floor */}
          <path d="M -500 420 Q -300 360 -100 420 T 300 420" fill="none" stroke="#1A2434" strokeWidth={6} />
          <path d="M -420 420 Q -200 470 0 420 T 420 420" fill="none" stroke="#141B28" strokeWidth={5} />
          {/* the first prototype: slumped, broken, one dim red eye waking */}
          <g opacity={0.55}>
            <ChamberGlass x={-60} glow={0.05} red={0.4} />
          </g>
          <Stickman
            x={-60}
            y={FLOOR}
            scale={1.2}
            facing={1}
            pose={{...museIdle(t, 9), headTilt: 14, lean: 12, look: 0.4}}
            look={{
              top: "#3A3F46",
              sleeve: "#2E3238",
              skin: "#8A8F96",
              hideLegs: true,
              headBack: <MuseHairBack />,
              headExtra: (
                <g opacity={wake}>
                  <circle cx={-11} cy={-3} r={8} fill={CRIMSON} opacity={0.4} />
                  <circle cx={11} cy={-3} r={8} fill={CRIMSON} opacity={0.4} />
                  <circle cx={-11} cy={-3} r={4} fill="#FF6B57" />
                  <circle cx={11} cy={-3} r={4} fill="#FF6B57" />
                </g>
              ),
              lower: <MuseGown />,
            }}
            expr="neutral"
          />
          <Glow x={-60} y={-140} r={200 + wake * 160} color={CRIMSON} opacity={0.06 + wake * 0.14} />
          <Monitor
            x={330}
            y={-60}
            w={340}
            h={200}
            on={1}
            screen={
              <g>
                <text x={170} y={40} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={24} fill={SILVER}>
                  PROTOTYPE 01
                </text>
                <text x={170} y={84} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={22} fill={CRIMSON}>
                  STATUS: DELETED
                </text>
                <text x={170} y={124} textAnchor="middle" fontFamily="Inter" fontWeight={600} fontSize={20} fill={SILVER}>
                  TERMINATED 2036
                </text>
                <text x={170} y={160} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={AMBER}>
                  SIGNAL: STILL ACTIVE
                </text>
              </g>
            }
          />
          <Stickman x={-420} y={FLOOR} scale={1.0} facing={1} pose={{...idle(t, 0), lean: 5, look: 0.9}} look={ADRIAN} expr="worried" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 7: the fight for her voice — MUSE's eyes strobe blue-red-blue. */
const FightForVoice: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.15, rot: 0}],
    [S7.len, {x: 0, y: 60, zoom: 1.28, rot: 0}],
  ]);
  // strobe: eyes flip blue-red ~3x per second while she fights
  const strobe = Math.sin(t * 19) > 0 ? 1 : 0.05;
  const shake = Math.sin(t * 22) * 4;
  const reach = prog(frame, 130, 210, eOut);
  const tilt = keys(frame, [[0, -4], [90, 8], [180, -9], [300, 4]], eInOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.8);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070308" handheld={0.7}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={1.3} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={80} y={-140} r={460} color={CRIMSON} opacity={0.1 + strobe * 0.12} />
          <Glow x={80} y={-140} r={380} color={ICE} opacity={0.1 + (1 - strobe) * 0.12} />
          <ChamberGlass x={80} glow={0.1} red={strobe} />
          <Stickman x={80 + shake} y={FLOOR} scale={1.4} facing={-1} pose={{...museIdle(t, 7), headTilt: tilt, lean: -6, look: -0.6}} look={museLook(1, pulse, strobe)} expr="shout" />
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
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 8: the twist — the Other knows Adrian's name and birth date. */
const TheTwist: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [S8.len, {x: 0, y: 100, zoom: 1.12, rot: 0}],
  ]);
  const rowIn = (i: number) => prog(frame, 60 + i * 55, 110 + i * 55, eOut);
  const stepBack = prog(frame, 170, 240, eOut);
  const humanX = -330 - stepBack * 70;
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070308" handheld={0.4}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={1.0} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={120} y={-160} r={420} color={CRIMSON} opacity={0.14} />
          <Monitor
            x={120}
            y={-80}
            w={560}
            h={360}
            on={1}
            screen={
              <g>
                <text x={280} y={40} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={26} fill="#FF8A7A">
                  SUBJECT IDENTIFIED
                </text>
                <g opacity={rowIn(0)}>
                  <text x={40} y={100} fontFamily="Inter" fontWeight={800} fontSize={26} fill="#E8ECF2">
                    ADRIAN COLE
                  </text>
                </g>
                <g opacity={rowIn(1)}>
                  <text x={40} y={150} fontFamily="Inter" fontWeight={700} fontSize={24} fill={SILVER}>
                    BORN: MARCH 14
                  </text>
                </g>
                <g opacity={rowIn(2)}>
                  <rect x={24} y={178} width={512} height={46} rx={6} fill={CRIMSON} opacity={0.25} />
                  <text x={40} y={209} fontFamily="Inter" fontWeight={800} fontSize={24} fill="#FF8A7A">
                    SOURCE: UNKNOWN
                  </text>
                </g>
                <g opacity={rowIn(3)}>
                  <text x={280} y={280} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={22} fill={AMBER}>
                    NEVER ENTERED INTO ANY SYSTEM
                  </text>
                </g>
              </g>
            }
          />
          {/* the Other, calm — red eyes steady */}
          <g opacity={0.55}>
            <ChamberGlass x={520} glow={0.08} red={0.8} />
            <Stickman x={455} y={FLOOR} scale={0.9} facing={-1} pose={{...museIdle(t, 1), headTilt: -3, look: -0.6}} look={museLook(1, pulse, 1)} expr="smug" />
          </g>
          <Stickman
            x={humanX}
            y={FLOOR}
            scale={1.0}
            facing={1}
            pose={{...idle(t, 0), lean: -6 * stepBack, headTilt: -4 * stepBack, look: 0.9}}
            look={ADRIAN}
            expr={stepBack > 0.4 ? "surprised" : "worried"}
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 9: cliffhanger — her eyes go dark, then blue again. Wrong smile. */
const Cliffhanger: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.1, rot: 0}],
    [S9.len, {x: 0, y: 60, zoom: 1.3, rot: 0}],
  ]);
  const lightsOut = prog(frame, 60, 130, eOut);
  const eyesBack = prog(frame, 150, 200, eOut);
  const wrongSmile = prog(frame, 200, 260, eOut);
  const tbcIn = prog(frame, 240, 285, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const museX = 60;
  // eyes: dark while lightsOut, then blue again — but the smile is wrong
  const eyesOpen = 1 - lightsOut * (1 - eyesBack);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C">
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1} opacity={1 - lightsOut * 0.7}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={museX} y={-140} r={420} color={ICE} opacity={0.16 * eyesOpen} />
          <Glow x={museX} y={-140} r={300} color={CRIMSON} opacity={0.05} />
          <rect x={-120} y={-560} width={360} height={980} rx={40} fill={ICE} opacity={0.05} stroke={ICE} strokeWidth={4} />
          <Stickman x={museX} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 5), headTilt: -5, lean: -4, look: -0.7}} look={museLook(eyesOpen, pulse)} expr={wrongSmile > 0.5 ? "smug" : "sad"} />
          <Stickman x={-320} y={FLOOR} scale={1.05} facing={1} pose={{...idle(t, 0), lean: -4, look: 0.9}} look={ADRIAN} expr="worried" />
        </Layer>
      </Camera2D>
      {/* darkness swallows everything — except her eyes when they return. */}
      <div style={{position: "absolute", inset: 0, background: "#000000", opacity: lightsOut * 0.93, pointerEvents: "none"}} />
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
          NEXT — EPISODE 04: AWAKENING
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const MuseAwakeningEp03: React.FC = () => {
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
        <TwoPatterns />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <NoMatch />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <ItSpeaks />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <FileZero />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <PrototypeOne />
      </Sequence>
      <Sequence from={S7.from} durationInFrames={S7.len}>
        <FightForVoice />
      </Sequence>
      <Sequence from={S8.from} durationInFrames={S8.len}>
        <TheTwist />
      </Sequence>
      <Sequence from={S9.from} durationInFrames={S9.len}>
        <Cliffhanger />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
