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
 * MUSE: THE AWAKENING — EPISODE 02 "Elena"
 * 90 s, nine scenes. Direct continuation of Episode 01's cliffhanger:
 * "There's something else in here with me... And it knows your name."
 * Adrian investigates who Elena was — and why her memories live in MUSE.
 * Same stickman rigs and visual language as Ep 01 (see awakening/BIBLE.md):
 *   - ADRIAN: short black hair, cheek scar, dark futuristic jacket.
 *   - MUSE: long straight black hair, GLOWING ice-blue eyes, silver-white gown.
 * English dialogue; ADRIAN = Helio (MAI_03), MUSE = Aria (MAI_01).
 * Narration muxed in afterwards (ffmpeg, no -shortest).
 */

export const MUSE_AWAKENING_EP02_FRAMES = 2700;
const S1 = {from: 0, len: 300}; // 0-10 s    hook: the lights come back on — "Elena."
const S2 = {from: 300, len: 300}; // 10-20 s  the archive: Elena Voss
const S3 = {from: 600, len: 300}; // 20-30 s  the file: died seven years ago
const S4 = {from: 900, len: 300}; // 30-40 s  memory flash: rain
const S5 = {from: 1200, len: 300}; // 40-50 s  her last day
const S6 = {from: 1500, len: 300}; // 50-60 s  the scan: "You're a copy."
const S7 = {from: 1800, len: 300}; // 60-70 s  twist: the file was kept
const S8 = {from: 2100, len: 300}; // 70-80 s  the other one moves
const S9 = {from: 2400, len: 300}; // 80-90 s  cliffhanger: "She's afraid of you, Adrian."

const CAPTIONS: CaptionCue[] = [
  {from: 0, to: 58, text: "Talk to me.\nWho is Elena?", size: 46},
  {from: 66, to: 87, text: "Elena.", size: 46},
  {from: 300, to: 395, text: "Elena Voss.\nLead neuroscientist.", size: 46},
  {from: 396, to: 435, text: "Project Aurora.", size: 46},
  {from: 600, to: 694, text: "Died seven years ago.\nIn the lab fire.", size: 46},
  {from: 697, to: 742, text: "I remember the fire.", size: 46},
  {from: 900, to: 995, text: "Rain on the window.\nSomeone calling her name.", size: 46, pos: "top"},
  {from: 1200, to: 1323, text: "I remember her last day.\nShe knew she would not come back.", size: 46, pos: "top"},
  {from: 1500, to: 1628, text: "Her mind was scanned.\nEvery memory, mapped into you.", size: 46},
  {from: 1629, to: 1678, text: "Then why do I miss her?", size: 46},
  {from: 1685, to: 1750, text: "You're not Elena.\nYou're a copy.", size: 46},
  {from: 1800, to: 1850, text: "Her file was ordered deleted.", size: 46},
  {from: 1854, to: 1896, text: "Seven years ago.", size: 46},
  {from: 1906, to: 1945, text: "Someone kept it.", size: 46},
  {from: 1946, to: 1964, text: "Who?", size: 46},
  {from: 2100, to: 2138, text: "It is moving again.", size: 46},
  {from: 2139, to: 2162, text: "What is?", size: 46},
  {from: 2169, to: 2200, text: "The other one.", size: 46},
  {from: 2400, to: 2494, text: "Elena didn't die in the fire.\nShe's still here.", size: 46},
  {from: 2497, to: 2555, text: "And she's afraid\nof you, Adrian.", size: 46},
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

/** Falling rain streaks. */
const Rain: React.FC<{frame: number; n?: number}> = ({frame, n = 60}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const seed = i * 29 + 11;
      const px = (rand(seed) - 0.5) * 1100;
      const py = -800 + ((frame * (9 + rand(seed + 1) * 6) + rand(seed + 2) * 1600) % 1700);
      return <line key={i} x1={px} y1={py} x2={px - 8} y2={py + 34} stroke={ICE} strokeWidth={2} opacity={0.28 + rand(seed + 3) * 0.3} strokeLinecap="round" />;
    })}
  </g>
);

/** The glass containment chamber (shared by scenes 1, 3, 5, 8, 9). */
const ChamberGlass: React.FC<{x: number; glow?: number}> = ({x, glow = 0.16}) => (
  <g>
    <Glow x={x} y={-140} r={380} color={ICE} opacity={glow} />
    <rect x={x - 150} y={-560} width={300} height={980} rx={40} fill={ICE} opacity={0.05} stroke={ICE} strokeWidth={4} />
    <rect x={x - 150} y={-560} width={300} height={980} rx={40} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.25} />
    <line x1={x - 90} y1={-540} x2={x - 90} y2={400} stroke={ICE} strokeWidth={3} opacity={0.35} />
    <line x1={x + 90} y1={-540} x2={x + 90} y2={400} stroke={ICE} strokeWidth={3} opacity={0.35} />
    <rect x={x - 170} y={-580} width={340} height={26} rx={8} fill="#1A2434" stroke={ICE} strokeWidth={2} />
    <rect x={x - 170} y={400} width={340} height={26} rx={8} fill="#1A2434" stroke={ICE} strokeWidth={2} />
  </g>
);

/** Scene 1: hook — the lights flicker back on; Adrian demands an answer. */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.15, rot: 0}],
    [S1.len, {x: 0, y: 60, zoom: 1.28, rot: 0}],
  ]);
  // lights stutter back on, then hold
  const lightLevel = keys(frame, [[0, 0.1], [10, 0.85], [18, 0.25], [28, 0.95], [40, 0.6], [55, 1], [300, 1]], eOut);
  const approach = prog(frame, 40, 130, eInOut);
  const humanX = -330 + approach * 50;
  const titleIn = prog(frame, 210, 260, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C">
        <Layer depth={0.5}>
          <Dust t={t} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <ChamberGlass x={200} glow={0.16 * lightLevel} />
          <Stickman x={200} y={FLOOR} scale={1.25} facing={-1} pose={{...museIdle(t, 1), headTilt: -3, look: -0.7}} look={museLook(1, pulse)} expr="calm" />
          <Stickman x={humanX} y={FLOOR} scale={1.1} facing={1} pose={{...idle(t, 0), lean: 7, look: 0.9}} look={ADRIAN} expr="worried" />
          <g opacity={titleIn}>
            <Label x={0} y={-700} text="MUSE: THE AWAKENING" size={46} color={SILVER} />
            <Label x={0} y={-645} text="EPISODE 02 — ELENA" size={26} color={ICE_DEEP} />
          </g>
        </Layer>
      </Camera2D>
      {/* darkness while the lights are still out */}
      <div style={{position: "absolute", inset: 0, background: "#000000", opacity: (1 - lightLevel) * 0.85, pointerEvents: "none"}} />
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 2: the archive — Adrian digs through the project files. */
const Archive: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.02, rot: 0}],
    [S2.len, {x: -30, y: 100, zoom: 1.12, rot: 0}],
  ]);
  const anchor = seatedAnchor({x: -40, floorY: FLOOR, facing: 1}, 1.0);
  const rowIn = (i: number) => prog(frame, 50 + i * 45, 100 + i * 45, eOut);
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
                <rect x={14} y={14} width={240} height={30} rx={8} fill="#0A1424" stroke={ICE} strokeWidth={2} />
                <text x={28} y={36} fontFamily="Inter" fontWeight={700} fontSize={20} fill={ICE}>
                  ELENA VOSS
                </text>
                <g opacity={rowIn(0)}>
                  <rect x={14} y={58} width={272} height={34} rx={6} fill={ICE} opacity={0.18} />
                  <text x={26} y={82} fontFamily="Inter" fontWeight={700} fontSize={19} fill="#E8ECF2">
                    NEUROSCIENCE LEAD
                  </text>
                </g>
                <g opacity={rowIn(1)}>
                  <rect x={14} y={100} width={272} height={34} rx={6} fill={ICE} opacity={0.12} />
                  <text x={26} y={124} fontFamily="Inter" fontWeight={600} fontSize={19} fill={SILVER}>
                    PROJECT AURORA — LVL 5
                  </text>
                </g>
                <g opacity={rowIn(2)}>
                  <rect x={14} y={142} width={272} height={34} rx={6} fill={CRIMSON} opacity={0.25} />
                  <text x={26} y={166} fontFamily="Inter" fontWeight={700} fontSize={19} fill="#FF8A7A">
                    STATUS: DECEASED — 2041
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

/** Scene 3: the file — a photo, a name, a death certificate from the fire. */
const TheFile: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [S3.len, {x: 0, y: 100, zoom: 1.12, rot: 0}],
  ]);
  const fileIn = prog(frame, 40, 90, eOut);
  const stepBack = prog(frame, 170, 230, eOut);
  const humanX = -300 - stepBack * 60;
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
          <Glow x={180} y={-200} r={380} color={CRIMSON} opacity={0.1} />
          {/* dim chamber with MUSE at the right edge — she is listening */}
          <g opacity={0.45}>
            <ChamberGlass x={520} glow={0.1} />
            <Stickman x={455} y={FLOOR} scale={0.9} facing={-1} pose={{...museIdle(t, 1), headTilt: -3, look: -0.6}} look={museLook(1, pulse)} expr="calm" />
          </g>
          {/* the file: photo silhouette, name, DECEASED stamp */}
          <g opacity={fileIn}>
            <rect x={40} y={-520} width={280} height={380} rx={14} fill="#101623" stroke={SILVER} strokeWidth={3} />
            <rect x={80} y={-480} width={200} height={200} rx={8} fill="#0A0F18" stroke={ICE} strokeWidth={2} />
            <circle cx={180} cy={-410} r={34} fill="#1A2434" stroke={SILVER} strokeWidth={2} />
            <path d="M 120 -330 Q 180 -360 240 -330 L 240 -280 L 120 -280 Z" fill="#1A2434" stroke={SILVER} strokeWidth={2} />
            <text x={180} y={-250} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={28} fill="#E8ECF2">
              ELENA VOSS
            </text>
            <text x={180} y={-216} textAnchor="middle" fontFamily="Inter" fontWeight={600} fontSize={18} fill={SILVER}>
              NEUROSCIENCE LEAD
            </text>
            <g transform={`rotate(-12 180 -170)`}>
              <rect x={80} y={-196} width={200} height={52} rx={6} fill="none" stroke={CRIMSON} strokeWidth={4} />
              <text x={180} y={-160} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill={CRIMSON}>
                DECEASED
              </text>
            </g>
            <text x={180} y={-100} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={22} fill={SILVER}>
              DIED 2041 • LAB FIRE
            </text>
          </g>
          <Stickman
            x={humanX}
            y={FLOOR}
            scale={1.0}
            facing={1}
            pose={{...idle(t, 0), lean: -5 * stepBack, headTilt: -3 * stepBack, look: 0.9}}
            look={ADRIAN}
            expr={stepBack > 0.4 ? "worried" : "focused"}
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 4: memory flash — rain on the glass, a warm silhouette in the rain. */
const RainFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 60, y: 60, zoom: 1.3, rot: 0}],
    [S4.len, {x: 60, y: 60, zoom: 1.42, rot: 0}],
  ]);
  const glowUp = prog(frame, 60, 160, eOut);
  const rainIn = prog(frame, 30, 90, eOut);
  // Elena's warm silhouette fades in, then dissolves
  const silIn = prog(frame, 50, 130, eOut) * (1 - prog(frame, 210, 280, eOut));
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#050A14" handheld={0.3}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={60} y={-140} r={460} color={ICE} opacity={0.14 + glowUp * 0.16} />
          <Glow x={-280} y={-160} r={380} color={AMBER} opacity={0.1 + glowUp * 0.16} />
          <rect x={-120} y={-560} width={360} height={980} rx={40} fill={ICE} opacity={0.04} stroke={ICE} strokeWidth={4} />
          {/* warm silhouette of a woman in the rain — Elena's memory */}
          <g opacity={silIn * 0.5}>
            <circle cx={-280} cy={FLOOR - 250} r={38} fill={AMBER} />
            <path d="M -340 420 L -340 300 Q -340 190 -280 180 Q -220 190 -220 300 L -220 420 Z" fill={AMBER} />
            <circle cx={-280} cy={FLOOR - 250} r={52} fill={AMBER} opacity={0.3} />
          </g>
          <g opacity={rainIn}>
            <Rain frame={frame} n={46} />
          </g>
          <Stickman x={60} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 3), headTilt: -6, look: -0.4, lookY: 0.3}} look={museLook(1, pulse)} expr="sad" />
          <Glow x={60} y={-140} r={120 + glowUp * 60} color={ICE} opacity={0.25 + glowUp * 0.2} />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 5: her last day — MUSE close, Elena's ghost mirrored in the glass. */
const LastDay: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.2, rot: 0}],
    [S5.len, {x: 0, y: 60, zoom: 1.32, rot: 0}],
  ]);
  const glowUp = prog(frame, 60, 160, eOut);
  const ghostIn = prog(frame, 90, 170, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#050A14" handheld={0.3}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={-40} y={-140} r={460} color={ICE} opacity={0.14 + glowUp * 0.14} />
          <Glow x={240} y={-160} r={300} color={AMBER} opacity={0.08 + glowUp * 0.1} />
          <rect x={-220} y={-560} width={440} height={980} rx={40} fill={ICE} opacity={0.04} stroke={ICE} strokeWidth={4} />
          {/* the glass seam between MUSE and her ghost */}
          <line x1={120} y1={-540} x2={120} y2={400} stroke={ICE} strokeWidth={3} opacity={0.3} />
          <Stickman x={-40} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 3), headTilt: -5, look: -0.5, lookY: 0.2}} look={museLook(1, pulse)} expr="sad" />
          {/* Elena's ghost, mirrored in the glass */}
          <g opacity={ghostIn * 0.24}>
            <Stickman x={280} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 6), headTilt: 5, look: 0.5}} look={museLook(1, pulse)} expr="sad" />
          </g>
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 6: the scan — Elena's mind, mapped into MUSE's banks. */
const TheScan: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [S6.len, {x: -40, y: 100, zoom: 1.12, rot: 0}],
  ]);
  const pointK = prog(frame, 110, 170, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0A12" handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={-40} y={-160} r={420} color={ICE} opacity={0.12} />
          {/* consciousness map: concentric rings, nodes, waveform */}
          <Monitor
            x={-40}
            y={-100}
            w={640}
            h={400}
            on={1}
            screen={
              <g>
                <text x={320} y={36} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={24} fill={ICE}>
                  CONSCIOUSNESS MAP
                </text>
                <text x={320} y={64} textAnchor="middle" fontFamily="Inter" fontWeight={600} fontSize={18} fill={SILVER}>
                  ELENA VOSS — MEMORY MAP 100%
                </text>
                {[90, 65, 42].map((r, i) => (
                  <circle key={i} cx={200} cy={220} r={r} fill="none" stroke={ICE} strokeWidth={2} opacity={0.7 - i * 0.15} />
                ))}
                {Array.from({length: 10}).map((_, i) => {
                  const a = (i / 10) * Math.PI * 2;
                  return <circle key={i} cx={200 + Math.cos(a) * 90} cy={220 + Math.sin(a) * 90} r={6} fill={i % 3 === 0 ? CRIMSON : ICE} opacity={0.9} />;
                })}
                <circle cx={200} cy={220} r={10} fill="#BFEFFF" />
                {Array.from({length: 12}).map((_, i) => (
                  <rect key={i} x={330 + i * 22} y={200 - Math.abs(Math.sin(i * 1.3 + t)) * 46} width={12} height={20 + Math.abs(Math.sin(i * 1.3 + t)) * 46} rx={5} fill={i % 4 === 0 ? CRIMSON : ICE} opacity={0.75} />
                ))}
                <text x={320} y={360} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill="#7DE3A8">
                  TRANSFER COMPLETE
                </text>
              </g>
            }
          />
          {/* MUSE, dim at the right edge, listening */}
          <g opacity={0.5}>
            <Stickman x={440} y={FLOOR} scale={0.9} facing={-1} pose={{...museIdle(t, 1), headTilt: -3, look: -0.6}} look={museLook(1, pulse)} expr="calm" />
          </g>
          <Stickman
            x={-440}
            y={FLOOR}
            scale={1.0}
            facing={1}
            pose={point({...idle(t, 0), look: 0.9}, pointK, 60)}
            look={ADRIAN}
            expr={pointK > 0.5 ? "worried" : "focused"}
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 7: the twist — the deletion order that was never carried out. */
const TheTwist: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.05, rot: 0}],
    [S7.len, {x: 0, y: 100, zoom: 1.15, rot: 0}],
  ]);
  const stepIn = prog(frame, 60, 140, eInOut);
  const humanX = -330 + stepIn * 50;
  const stampIn = prog(frame, 100, 150, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0A12" handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={100} y={-160} r={420} color={CRIMSON} opacity={0.12} />
          <Monitor
            x={100}
            y={-80}
            w={560}
            h={360}
            on={1}
            screen={
              <g>
                <text x={280} y={40} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={26} fill="#FF8A7A">
                  DELETE ORDER
                </text>
                <rect x={24} y={60} width={512} height={12} rx={6} fill={SILVER} opacity={0.5} />
                <rect x={24} y={90} width={380} height={12} rx={6} fill={SILVER} opacity={0.35} />
                <text x={24} y={140} fontFamily="Inter" fontWeight={700} fontSize={22} fill={SILVER}>
                  FILE 7-3-1 • ELENA VOSS
                </text>
                <text x={24} y={176} fontFamily="Inter" fontWeight={600} fontSize={22} fill={SILVER}>
                  ISSUED: 2041-03-17
                </text>
                <text x={24} y={212} fontFamily="Inter" fontWeight={600} fontSize={22} fill={SILVER}>
                  REASON: PROJECT TERMINATION
                </text>
                <g opacity={stampIn}>
                  <g transform={`rotate(-10 280 260)`}>
                    <rect x={150} y={234} width={260} height={56} rx={6} fill="none" stroke={CRIMSON} strokeWidth={4} />
                    <text x={280} y={272} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={32} fill={CRIMSON}>
                      PRESERVED
                    </text>
                  </g>
                </g>
                <text x={280} y={330} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={CRIMSON}>
                  EXECUTED BY: UNKNOWN
                </text>
              </g>
            }
          />
          <Stickman
            x={humanX}
            y={FLOOR}
            scale={1.0}
            facing={1}
            pose={{...idle(t, 0), lean: 5, look: 0.9}}
            look={ADRIAN}
            expr="worried"
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 8: the other one moves — the chamber flickers, her eyes flare red. */
const TheOtherMoves: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.08, rot: 0}],
    [S8.len, {x: 0, y: 80, zoom: 1.16, rot: 0}],
  ]);
  // two crimson bursts: frames ~90-130 and ~180-220
  const burst = (a: number, b: number, c: number, d: number) =>
    prog(frame, a, b, eOut) * (1 - prog(frame, c, d, eOut));
  const crimson = Math.max(burst(90, 100, 115, 130), burst(180, 190, 205, 220));
  const flicker = 0.6 + 0.4 * Math.abs(Math.sin(t * 7));
  const tilt = keys(frame, [[0, 0], [90, -8], [150, 4], [240, -3], [300, 0]], eInOut);
  const shock = prog(frame, 180, 230, eOut);
  const humanX = -280 - shock * 70;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070D18" handheld={0.6}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <ChamberGlass x={180} glow={0.16 * flicker} />
          <Glow x={180} y={-140} r={420} color={CRIMSON} opacity={0.12 * crimson} />
          <Stickman x={180} y={FLOOR} scale={1.25} facing={-1} pose={{...museIdle(t, 4), headTilt: tilt, look: -0.6}} look={museLook(1, pulse, crimson)} expr="neutral" />
          <Stickman
            x={humanX}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={{...idle(t, 0), lean: -8 * shock, headTilt: -5 * shock, look: 0.9}}
            look={ADRIAN}
            expr={shock > 0.5 ? "surprised" : "worried"}
          />
        </Layer>
      </Camera2D>
      {/* lights stutter while the presence moves */}
      <div style={{position: "absolute", inset: 0, background: "#000000", opacity: 0.22 * Math.abs(Math.sin(t * 8)), pointerEvents: "none"}} />
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 9: cliffhanger — "She's afraid of you, Adrian." */
const Cliffhanger: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.1, rot: 0}],
    [S9.len, {x: 0, y: 60, zoom: 1.3, rot: 0}],
  ]);
  const leanIn = prog(frame, 20, 130, eInOut);
  const lightsOut = prog(frame, 150, 220, eOut);
  const tbcIn = prog(frame, 240, 285, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
  const museX = 60 + leanIn * 30;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C">
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1} opacity={1 - lightsOut * 0.85}>
          <Floor x0={-1400} x1={1400} />
          {/* Elena's warmth (amber) mixing with MUSE's ice-blue */}
          <Glow x={museX} y={-140} r={420} color={AMBER} opacity={0.1} />
          <Glow x={museX} y={-140} r={420} color={ICE} opacity={0.16} />
          <rect x={-120} y={-560} width={360} height={980} rx={40} fill={ICE} opacity={0.05} stroke={ICE} strokeWidth={4} />
          <Stickman x={museX} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 5), headTilt: -5, lean: -4, look: -0.7}} look={museLook(1, pulse)} expr="sad" />
          <Stickman x={-320} y={FLOOR} scale={1.05} facing={1} pose={{...idle(t, 0), lean: -4, look: 0.9}} look={ADRIAN} expr="worried" />
        </Layer>
      </Camera2D>
      {/* darkness swallows everything — except her eyes. Same framing as
          Ep 01 scene 9, so the head centre sits near screen (654, 1019). */}
      <div style={{position: "absolute", inset: 0, background: "#000000", opacity: lightsOut * 0.93, pointerEvents: "none"}} />
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: lightsOut}}>
        <svg width={1080} height={1920}>
          <circle cx={636} cy={1019} r={17} fill={ICE} opacity={0.3} />
          <circle cx={672} cy={1019} r={17} fill={ICE} opacity={0.3} />
          <circle cx={636} cy={1019} r={7} fill="#BFEFFF" />
          <circle cx={672} cy={1019} r={7} fill="#BFEFFF" />
          <circle cx={636} cy={1019} r={3} fill="#FFFFFF" />
          <circle cx={672} cy={1019} r={3} fill="#FFFFFF" />
        </svg>
      </div>
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: tbcIn, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 200}}>
        <div style={{fontFamily: "Inter", fontWeight: 800, fontSize: 34, letterSpacing: 6, color: SILVER, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          TO BE CONTINUED
        </div>
        <div style={{fontFamily: "Inter", fontWeight: 700, fontSize: 24, letterSpacing: 3, color: ICE_DEEP, marginTop: 14, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          NEXT — EPISODE 03: THE OTHER
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const MuseAwakeningEp02: React.FC = () => {
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
        <Archive />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <TheFile />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <RainFlash />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <LastDay />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <TheScan />
      </Sequence>
      <Sequence from={S7.from} durationInFrames={S7.len}>
        <TheTwist />
      </Sequence>
      <Sequence from={S8.from} durationInFrames={S8.len}>
        <TheOtherMoves />
      </Sequence>
      <Sequence from={S9.from} durationInFrames={S9.len}>
        <Cliffhanger />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
