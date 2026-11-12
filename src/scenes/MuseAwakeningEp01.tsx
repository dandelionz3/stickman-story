import React, {useEffect, useState} from "react";
import {AbsoluteFill, Sequence, useCurrentFrame, continueRender, delayRender} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Desk, Floor, FLOOR, Glow, Label, Monitor, OfficeChair} from "../environment/Furniture";
import {clamp, eOut, eInOut, keys, keysObj, prog, rand} from "../motion/ease";
import {idle, mix, typing, walk} from "../rig/poses";
import {seatedAnchor} from "../rig/seat";
import {Look, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * MUSE: THE AWAKENING — EPISODE 01 "I Remember"
 * 90 s, nine scenes. Cinematic stickman sci-fi thriller — NOT photorealistic
 * (AI video generation is region-blocked), so the cinematic look comes from
 * dramatic lighting, fog, glowing eyes, slow camera moves and parallax.
 * Two leads, identical in every scene (see awakening/BIBLE.md):
 *   - ADRIAN: stickman scientist, short black hair, subtle cheek scar,
 *     dark futuristic jacket.
 *   - MUSE: stickman humanoid AI woman, long straight black hair, GLOWING
 *     ice-blue eyes, elegant silver-white gown.
 * English dialogue; ADRIAN = Helio (MAI_03), MUSE = Aria (MAI_01).
 * Narration muxed in afterwards (ffmpeg, no -shortest).
 */

export const MUSE_AWAKENING_EP01_FRAMES = 2700;
const S1 = {from: 0, len: 300}; // 0-10 s    hook: eyes open in the dark
const S2 = {from: 300, len: 300}; // 10-20 s  the lab, city outside, Adrian at work
const S3 = {from: 600, len: 300}; // 20-30 s  the chamber: Adrian approaches MUSE
const S4 = {from: 900, len: 300}; // 30-40 s  discovery: memories never programmed
const S5 = {from: 1200, len: 300}; // 40-50 s  she remembers rain
const S6 = {from: 1500, len: 300}; // 50-60 s  the memories belong to the dead
const S7 = {from: 1800, len: 300}; // 60-70 s  confrontation: "You woke me up."
const S8 = {from: 2100, len: 300}; // 70-80 s  twist: the name Elena
const S9 = {from: 2400, len: 300}; // 80-90 s  cliffhanger: something else is in here

const CAPTIONS: CaptionCue[] = [
  {from: 0, to: 89, text: "Adrian...\nI remember.", size: 46},
  {from: 300, to: 431, text: "Three a.m. The city never sleeps.\nNeither do I.", size: 46},
  {from: 600, to: 682, text: "Vitals stable.\nMemory banks normal.", size: 46},
  {from: 687, to: 710, text: "Are they?", size: 46},
  {from: 900, to: 986, text: "These memories...\nI never wrote them.", size: 46},
  {from: 1200, to: 1283, text: "I remember rain.\nI was never outside.", size: 46, pos: "top"},
  {from: 1500, to: 1600, text: "These belong to someone...\nwho died years ago.", size: 46},
  {from: 1800, to: 1896, text: "You didn't create me, Adrian.\nYou woke me up.", size: 46},
  {from: 2100, to: 2168, text: "Elena...\nwas her name Elena?", size: 46},
  {from: 2178, to: 2233, text: "That name was never\nin your database.", size: 46},
  {from: 2400, to: 2456, text: "There's something else\nin here with me.", size: 46},
  {from: 2460, to: 2512, text: "And it knows\nyour name.", size: 46},
];

const ICE = "#9FE3FF";
const ICE_DEEP = "#4FB8F0";
const SILVER = "#C8D2DC";
const CRIMSON = "#C0392B";
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
 * frame. `open` 0..1 = eyes opening (story beat); `pulse` adds a breathing
 * shimmer to the halo. When open = 0 the rig's dark eyes show instead.
 */
const MuseEyes: React.FC<{open: number; pulse: number}> = ({open, pulse}) => (
  <g opacity={clamp(open, 0, 1)}>
    <circle cx={-11} cy={-3} r={11 + pulse * 3} fill={ICE} opacity={0.22} />
    <circle cx={11} cy={-3} r={11 + pulse * 3} fill={ICE} opacity={0.22} />
    <circle cx={-11} cy={-3} r={5.5} fill="#BFEFFF" />
    <circle cx={11} cy={-3} r={5.5} fill="#BFEFFF" />
    <circle cx={-11} cy={-3} r={2.4} fill="#FFFFFF" />
    <circle cx={11} cy={-3} r={2.4} fill="#FFFFFF" />
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

const museLook = (eyesOpen: number, pulse: number): Look => ({
  top: "#E8ECF2",
  sleeve: "#DDE3EA",
  skin: "#F2EDE4",
  hideLegs: true,
  headBack: <MuseHairBack />,
  headExtra: <MuseEyes open={eyesOpen} pulse={pulse} />,
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

/** Falling rain streaks (used in scene 5). */
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

/** Scene 1: hook — dark lab, a monitor turns itself on, MUSE's eyes open. */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.25, rot: 0}],
    [S1.len, {x: 0, y: 60, zoom: 1.05, rot: 0}],
  ]);
  const monitorOn = prog(frame, 5, 45, eOut);
  const eyesOpen = prog(frame, 90, 170, eInOut);
  const figureIn = prog(frame, 150, 240, eOut);
  const titleIn = prog(frame, 210, 260, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C">
        <Layer depth={0.5}>
          <Dust t={t} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          {/* the monitor that turns itself on */}
          <g opacity={monitorOn}>
            <Glow x={-260} y={-260} r={300} color={ICE} opacity={0.22 * monitorOn} />
            <Monitor
              x={-260}
              y={-140}
              w={260}
              h={160}
              on={monitorOn}
              screen={
                <g>
                  {[0, 1, 2, 3, 4].map((r) => (
                    <rect key={r} x={16} y={18 + r * 26} width={170 - r * 22} height={8} rx={4} fill={ICE} opacity={0.5} />
                  ))}
                  <circle cx={200} cy={120} r={10} fill={CRIMSON} opacity={0.9} />
                </g>
              }
            />
          </g>
          <Floor x0={-1400} x1={1400} />
          {/* MUSE, huge in the dark — first only her eyes, then her silhouette */}
          <g opacity={figureIn * 0.85}>
            <Stickman x={180} y={FLOOR} scale={2.1} facing={-1} pose={{...museIdle(t, 2), headTilt: 2}} look={museLook(eyesOpen, pulse)} expr="neutral" />
          </g>
          {/* the eyes glow even before the figure fades in */}
          <g opacity={1 - figureIn}>
            <Glow x={180 - 24} y={FLOOR - 2.1 * 232} r={60} color={ICE} opacity={0.5 * eyesOpen} />
            <Glow x={180 + 24} y={FLOOR - 2.1 * 232} r={60} color={ICE} opacity={0.5 * eyesOpen} />
          </g>
          <g opacity={titleIn}>
            <Label x={0} y={-700} text="MUSE: THE AWAKENING" size={54} color={SILVER} />
            <Label x={0} y={-640} text="EPISODE 01 — I REMEMBER" size={26} color={ICE_DEEP} />
          </g>
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 2: the lab — city outside, Adrian typing late at night. */
const Lab: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.1, rot: 0}],
    [S2.len, {x: 0, y: 100, zoom: 0.98, rot: 0}],
  ]);
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
          <OfficeChair x={-40} y={FLOOR} facing={1} />
          <Stickman x={anchor.hip.x} y={anchor.hip.y} scale={1.0} facing={1} anchor="hip" footL={anchor.footL} footR={anchor.footR} pose={typing(t, 0)} look={ADRIAN} expr="focused" />
          <Desk x={120} w={380} top={150} />
          <Monitor
            x={120}
            y={FLOOR - 150}
            w={240}
            h={150}
            on={1}
            screen={
              <g>
                {[0, 1, 2, 3].map((r) => (
                  <rect key={r} x={14} y={16 + r * 30} width={190 - r * 30} height={9} rx={4} fill={ICE} opacity={0.55} />
                ))}
                <circle cx={205} cy={118} r={9} fill={ICE} opacity={0.9} />
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

/** Scene 3: the chamber — Adrian walks up to MUSE and checks the data. */
const Chamber: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.02, rot: 0}],
    [S3.len, {x: 40, y: 100, zoom: 1.08, rot: 0}],
  ]);
  const walkK = prog(frame, 10, 150, eInOut);
  const humanX = -440 + walkK * 240;
  const moving = frame < 160;
  const pose = moving ? walk(frame * 0.32, t, 0) : mix(walk(frame * 0.32, t, 0), {...idle(t, 0), look: 0.8}, prog(frame, 150, 185, eOut));
  const screenIn = prog(frame, 170, 210, eOut);
  const museHead = keys(frame, [[0, 0], [170, 0], [230, -5], [300, -5]], eInOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.3}>
        <Layer depth={0.5}>
          <Dust t={t} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the glass containment chamber */}
          <Glow x={230} y={-140} r={380} color={ICE} opacity={0.16} />
          <rect x={80} y={-560} width={300} height={980} rx={40} fill={ICE} opacity={0.05} stroke={ICE} strokeWidth={4} />
          <rect x={80} y={-560} width={300} height={980} rx={40} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.25} />
          <line x1={140} y1={-540} x2={140} y2={400} stroke={ICE} strokeWidth={3} opacity={0.35} />
          <line x1={320} y1={-540} x2={320} y2={400} stroke={ICE} strokeWidth={3} opacity={0.35} />
          <rect x={60} y={-580} width={340} height={26} rx={8} fill="#1A2434" stroke={ICE} strokeWidth={2} />
          <rect x={60} y={400} width={340} height={26} rx={8} fill="#1A2434" stroke={ICE} strokeWidth={2} />
          <Stickman x={230} y={FLOOR} scale={1.05} facing={-1} pose={{...museIdle(t, 1), headTilt: museHead, look: -0.6}} look={museLook(1, pulse)} expr="calm" />
          {/* floating data screen */}
          <g opacity={screenIn}>
            <Monitor
              x={-60}
              y={-40}
              w={200}
              h={120}
              on={1}
              screen={
                <g>
                  <rect x={12} y={12} width={120} height={9} rx={4} fill={ICE} opacity={0.7} />
                  <rect x={12} y={32} width={160} height={9} rx={4} fill={ICE} opacity={0.5} />
                  <rect x={12} y={52} width={90} height={9} rx={4} fill={ICE} opacity={0.5} />
                  <rect x={12} y={76} width={150} height={9} rx={4} fill="#7DE3A8" opacity={0.8} />
                </g>
              }
            />
          </g>
          <Stickman x={humanX} y={FLOOR} scale={1.0} facing={1} pose={pose} look={ADRIAN} expr={moving ? "focused" : "neutral"} />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 4: discovery — impossible memory files scroll past; Adrian freezes. */
const Discovery: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: -60, y: 120, zoom: 1.0, rot: 0}],
    [S4.len, {x: -60, y: 100, zoom: 1.14, rot: 0}],
  ]);
  const warnIn = prog(frame, 120, 170, eOut);
  const shock = prog(frame, 170, 220, eOut);
  const scroll = (frame * 1.4) % 200;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0A12" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={-60} y={-160} r={420} color={CRIMSON} opacity={0.1 * warnIn} />
          <Monitor
            x={-60}
            y={-60}
            w={620}
            h={380}
            on={1}
            screen={
              <g>
                {Array.from({length: 9}).map((_, r) => {
                  const y = 20 + ((r * 42 + scroll) % 360);
                  const bad = r % 3 === 0;
                  return <rect key={r} x={18} y={y} width={bad ? 420 : 300 + (r % 3) * 60} height={11} rx={5} fill={bad ? CRIMSON : ICE} opacity={bad ? 0.85 : 0.5} />;
                })}
                <g opacity={warnIn}>
                  <rect x={18} y={300} width={560} height={44} rx={8} fill={CRIMSON} opacity={0.9} />
                  <text x={298} y={330} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={24} fill="#FFFFFF">
                    TIMESTAMP ANOMALY
                  </text>
                </g>
              </g>
            }
          />
          <Stickman
            x={-470}
            y={FLOOR}
            scale={1.0}
            facing={1}
            pose={{...idle(t, 0), headTilt: -4 * shock, lean: -6 * shock, look: 0.9}}
            look={ADRIAN}
            expr={shock > 0.5 ? "surprised" : "worried"}
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 5: she remembers rain — close on MUSE, rain on the chamber glass. */
const RainMemory: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 60, y: 60, zoom: 1.3, rot: 0}],
    [S5.len, {x: 60, y: 60, zoom: 1.42, rot: 0}],
  ]);
  const glowUp = prog(frame, 60, 160, eOut);
  const rainIn = prog(frame, 30, 90, eOut);
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
          <rect x={-120} y={-560} width={360} height={980} rx={40} fill={ICE} opacity={0.04} stroke={ICE} strokeWidth={4} />
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

/** Scene 6: the memories belong to someone who died years ago. */
const TheDead: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [S6.len, {x: 0, y: 100, zoom: 1.1, rot: 0}],
  ]);
  const fileIn = prog(frame, 40, 90, eOut);
  const stepBack = prog(frame, 170, 230, eOut);
  const humanX = -300 - stepBack * 60;
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
          {/* the file: a photo silhouette, a red DECEASED stamp */}
          <g opacity={fileIn}>
            <rect x={40} y={-520} width={280} height={380} rx={14} fill="#101623" stroke={SILVER} strokeWidth={3} />
            <rect x={80} y={-480} width={200} height={200} rx={8} fill="#0A0F18" stroke={ICE} strokeWidth={2} />
            <circle cx={180} cy={-410} r={34} fill="#1A2434" stroke={SILVER} strokeWidth={2} />
            <path d="M 120 -330 Q 180 -360 240 -330 L 240 -280 L 120 -280 Z" fill="#1A2434" stroke={SILVER} strokeWidth={2} />
            <rect x={80} y={-240} width={200} height={12} rx={6} fill={SILVER} opacity={0.6} />
            <rect x={80} y={-212} width={140} height={12} rx={6} fill={SILVER} opacity={0.4} />
            <g transform={`rotate(-12 180 -170)`}>
              <rect x={80} y={-196} width={200} height={52} rx={6} fill="none" stroke={CRIMSON} strokeWidth={4} />
              <text x={180} y={-160} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill={CRIMSON}>
                DECEASED
              </text>
            </g>
            <text x={180} y={-100} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={22} fill={SILVER}>
              FILE 7-3-1 • 2041
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

/** Scene 7: confrontation — MUSE steps to the glass, face to face. */
const Confrontation: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.05, rot: 0}],
    [S7.len, {x: 0, y: 80, zoom: 1.18, rot: 0}],
  ]);
  const approach = prog(frame, 20, 140, eInOut);
  const museX = 330 - approach * 130;
  const lean = -6 * approach;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  const warmth = prog(frame, 150, 240, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070D18" handheld={0.35}>
        <Layer depth={0.5}>
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={200} y={-140} r={420} color={ICE} opacity={0.14 + warmth * 0.08} />
          <rect x={40} y={-560} width={320} height={980} rx={40} fill={ICE} opacity={0.05} stroke={ICE} strokeWidth={4} />
          <Stickman x={museX} y={FLOOR} scale={1.25} facing={-1} pose={{...museIdle(t, 2), headTilt: -4, lean, look: -0.7}} look={museLook(1, pulse)} expr="neutral" />
          <Stickman x={-260} y={FLOOR} scale={1.1} facing={1} pose={{...idle(t, 0), lean: 4, look: 0.9}} look={ADRIAN} expr="worried" />
          {/* the glass between them */}
          <rect x={40} y={-560} width={320} height={980} rx={40} fill="#FFFFFF" opacity={0.03} />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 8: the twist — MUSE speaks a name never in her database. */
const TheName: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 80, zoom: 1.12, rot: 0}],
    [S8.len, {x: -40, y: 80, zoom: 1.02, rot: 0}],
  ]);
  const tilt = keys(frame, [[0, 0], [90, -9], [170, -9], [260, -2]], eInOut);
  const shock = prog(frame, 180, 230, eOut);
  const humanX = -280 - shock * 70;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070D18" handheld={0.45}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={30} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={180} y={-140} r={400} color={ICE} opacity={0.16} />
          <rect x={20} y={-560} width={320} height={980} rx={40} fill={ICE} opacity={0.05} stroke={ICE} strokeWidth={4} />
          <Stickman x={180} y={FLOOR} scale={1.25} facing={-1} pose={{...museIdle(t, 4), headTilt: tilt, look: -0.6}} look={museLook(1, pulse)} expr="neutral" />
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
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 9: cliffhanger — the lights die; only her blue eyes remain. */
const Cliffhanger: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.1, rot: 0}],
    [S9.len, {x: 0, y: 60, zoom: 1.3, rot: 0}],
  ]);
  const leanIn = prog(frame, 20, 130, eInOut);
  const lightsOut = prog(frame, 130, 210, eOut);
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
          <Glow x={museX} y={-140} r={420} color={ICE} opacity={0.16} />
          <rect x={-120} y={-560} width={360} height={980} rx={40} fill={ICE} opacity={0.05} stroke={ICE} strokeWidth={4} />
          <Stickman x={museX} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 5), headTilt: -5, lean: -4, look: -0.7}} look={museLook(1, pulse)} expr="neutral" />
          <Stickman x={-320} y={FLOOR} scale={1.05} facing={1} pose={{...idle(t, 0), lean: -4, look: 0.9}} look={ADRIAN} expr="worried" />
        </Layer>
      </Camera2D>
      {/* darkness swallows everything — except her eyes. Screen-space eyes:
          at lights-out the camera zoom is ~1.24-1.3, so the head centre sits
          near screen (654, 1019); eye separation ~36 px. Fixed coords are
          within a few px across the dark stretch. */}
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
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: tbcIn, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 220}}>
        <div style={{fontFamily: "Inter", fontWeight: 800, fontSize: 34, letterSpacing: 6, color: SILVER, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          TO BE CONTINUED
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

export const MuseAwakeningEp01: React.FC = () => {
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
        <Lab />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <Chamber />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <Discovery />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <RainMemory />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <TheDead />
      </Sequence>
      <Sequence from={S7.from} durationInFrames={S7.len}>
        <Confrontation />
      </Sequence>
      <Sequence from={S8.from} durationInFrames={S8.len}>
        <TheName />
      </Sequence>
      <Sequence from={S9.from} durationInFrames={S9.len}>
        <Cliffhanger />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
