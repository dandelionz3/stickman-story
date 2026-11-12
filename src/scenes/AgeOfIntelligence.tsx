import React, {useEffect, useState} from "react";
import {AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Glow, Label} from "../environment/Furniture";
import {eInOut, eOut, keysObj, prog, rand} from "../motion/ease";
import {CASUAL, CurlyHair, RoundGlasses, ShortHair} from "../rig/looks";
import {cheer, idle} from "../rig/poses";
import {Look, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * THE AGE OF INTELLIGENCE — EPISODE 01: THE AWAKENING OF SIX AGENTS
 * 90 s stickman short film, six scenes, same visual language as the
 * TermiX stickman videos (dark background, neon accents, Inter captions).
 * English captions, narration muxed in afterwards (ffmpeg).
 * REUSE: TermixStickman60 structure, Stickman rig, CaptionTrack,
 * Camera2D, Glow/Label/Floor, font + continueRender pattern.
 */

export const AOI_FRAMES = 2700;
const S1 = {from: 0, len: 360}; // 0-12 s   silence before AI: megacity + awakening core
const S2 = {from: 360, len: 390}; // 12-25 s  first awakening: core + six portals
const S3 = {from: 750, len: 690}; // 25-48 s  six agents, one by one
const S4 = {from: 1440, len: 510}; // 48-65 s network awakens: lines + city lights
const S5 = {from: 1950, len: 510}; // 65-82 s AI revolution: threat + energy wave
const S6 = {from: 2460, len: 240}; // 82-90 s final revelation: title card

const CAPTIONS: CaptionCue[] = [
  {from: 15, to: 175, text: "Humanity once believed intelligence\nbelonged only to humans.", size: 46},
  {from: 185, to: 355, text: "But something extraordinary was\nabout to change everything."},
  {from: 375, to: 545, text: "From a single intelligence, six\nspecialized minds were born."},
  {from: 555, to: 745, text: "Each with a different purpose.\nEach with extraordinary capabilities."},
  {from: 765, to: 1085, text: "One discovers. One plans.\nOne builds. One executes."},
  {from: 1095, to: 1435, text: "One protects. And one\nconnects them all."},
  {from: 1455, to: 1695, text: "Their greatest power was never\nindividual intelligence."},
  {from: 1705, to: 1945, text: "It was thinking, collaborating,\nand acting as one."},
  {from: 1965, to: 2190, text: "Together, they become\nsomething greater."},
  {from: 2200, to: 2455, text: "A new generation of autonomous\nintelligence has arrived."},
  {from: 2475, to: 2695, text: "One network. Six minds.\nInfinite possibilities."},
];

const AGENT_COLORS = ["#35CBFA", "#E8C763", "#39FF6A", "#C45D31", "#7A5FBF", "#F5E9C8"];
const AGENT_NAMES = ["RESEARCH", "STRATEGY", "CODING", "EXECUTION", "SECURITY", "COORDINATION"];
const AGENT_X = [-330, -198, -66, 66, 198, 330];

const AGENT_LOOKS: Look[] = [
  {...CASUAL, top: AGENT_COLORS[0], headExtra: <RoundGlasses />},
  {...CASUAL, top: AGENT_COLORS[1], tie: "#8A6D1F", headExtra: <ShortHair color="#1E1E22" />},
  {...CASUAL, top: AGENT_COLORS[2], headBack: <CurlyHair color="#3A2A1E" />},
  {...CASUAL, top: AGENT_COLORS[3], hat: "cap", hatColor: "#2A2D33"},
  {...CASUAL, top: AGENT_COLORS[4], hat: "helmet", hatColor: "#3A2F52"},
  {...CASUAL, top: AGENT_COLORS[5], headExtra: <ShortHair color="#E8E0C8" />},
];

/** Faint stars for the night sky (deterministic, upper area only). */
const Stars: React.FC<{t: number}> = ({t}) =>
  (
    <g>
      {Array.from({length: 48}).map((_, i) => {
        const sx = (rand(i * 7 + 1) - 0.5) * 1040;
        const sy = -700 + rand(i * 7 + 2) * 560;
        const tw = 0.2 + 0.45 * Math.abs(Math.sin(t * 0.9 + i * 1.7));
        return <circle key={i} cx={sx} cy={sy} r={1.5 + rand(i * 7 + 3) * 2} fill="#CFE8FF" opacity={tw} />;
      })}
    </g>
  );

/** Deterministic megacity skyline. `lit` 0..1 = fraction of windows lit (staggered by seed). */
const Skyline: React.FC<{lit: number; flicker?: boolean; t?: number}> = ({lit, flicker = false, t = 0}) => {
  const buildings: {x: number; w: number; h: number}[] = [];
  let bx = -540;
  for (let i = 0; i < 15; i++) {
    const w = 58 + rand(i * 3 + 1) * 34;
    const h = 150 + rand(i * 3 + 2) * 280;
    buildings.push({x: bx, w, h});
    bx += w + 8;
  }
  return (
    <g>
      {buildings.map((b, bi) => {
        const cols = Math.floor(b.w / 20);
        const rows = Math.floor(b.h / 26);
        const wins: {x: number; y: number; on: number}[] = [];
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const seed = bi * 91 + c * 13 + r * 7;
            wins.push({x: b.x + 8 + c * 20, y: FLOOR - b.h + 14 + r * 26, on: prog(lit, rand(seed) * 0.8, rand(seed) * 0.8 + 0.2)});
          }
        }
        return (
          <g key={bi}>
            <rect x={b.x} y={FLOOR - b.h} width={b.w} height={b.h} fill="#121316" stroke={C.ink} strokeWidth={2} />
            {/* antenna on the tallest buildings */}
            {b.h > 380 ? <line x1={b.x + b.w / 2} y1={FLOOR - b.h} x2={b.x + b.w / 2} y2={FLOOR - b.h - 42} stroke={C.steel} strokeWidth={4} /> : null}
            {wins.map((wn, wi) => {
              const fl = flicker ? 0.55 + 0.45 * Math.sin(t * 7 + wi * 1.3) : 1;
              return <rect key={wi} x={wn.x} y={wn.y} width={9} height={12} fill={C.yellow} opacity={wn.on * 0.85 * fl} />;
            })}
          </g>
        );
      })}
    </g>
  );
};

/** Glowing AI core: concentric rings + bright center. */
const Core: React.FC<{x: number; y: number; r: number; color?: string; pulse?: number}> = ({x, y, r, color = "#35CBFA", pulse = 0}) => (
  <g>
    <Glow x={x} y={y} r={r * 2.6} color={color} opacity={0.3 + pulse * 0.1} />
    <circle cx={x} cy={y} r={r * 1.7} fill="none" stroke={color} strokeWidth={3} opacity={0.35} />
    <circle cx={x} cy={y} r={r * 1.25} fill="none" stroke={color} strokeWidth={5} opacity={0.6} />
    <circle cx={x} cy={y} r={r} fill={color} opacity={0.28} />
    <circle cx={x} cy={y} r={r * 0.55} fill={color} opacity={0.85} />
    <circle cx={x} cy={y} r={r * 0.22} fill="#FFFFFF" opacity={0.95} />
  </g>
);

/** Scene 1: dark megacity, blue light from below, camera descends to the awakening core. */
const Silence: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: -180, zoom: 0.92, rot: 0}],
    [S1.len, {x: 0, y: 170, zoom: 1.12, rot: 0}],
  ]);
  const coreIn = prog(frame, 200, 340, eOut);
  const glowUp = prog(frame, 60, 300, eInOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
          <Skyline lit={0.35} flicker t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={330} r={420} color="#35CBFA" opacity={0.08 + glowUp * 0.3} />
          <g opacity={coreIn}>
            <Core x={0} y={300} r={64 + Math.sin(t * 2.2) * 5} color="#35CBFA" pulse={Math.sin(t * 2.2)} />
          </g>
          {/* rising light beams from the core */}
          <g opacity={glowUp * 0.5}>
            <line x1={-40} y1={300} x2={-40} y2={-260} stroke="#35CBFA" strokeWidth={3} opacity={0.4} />
            <line x1={40} y1={300} x2={40} y2={-260} stroke="#35CBFA" strokeWidth={3} opacity={0.4} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: the core activates, data streams radiate, six portals orbit around it. */
const FirstAwakening: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 0, zoom: 1.0, rot: 0}],
    [S2.len, {x: 0, y: 0, zoom: 1.12, rot: 4}],
  ]);
  const coreR = 90 + prog(frame, 0, 120, eOut) * 50;
  const streams = 14;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
          <Skyline lit={0.6} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* data streams radiating from the core */}
          {Array.from({length: streams}).map((_, i) => {
            const ang = (i / streams) * Math.PI * 2 + t * 0.12;
            const x2 = Math.cos(ang) * 430;
            const y2 = -100 + Math.sin(ang) * 430;
            const dotR = 165 + ((frame * 4 + i * 97) % 250);
            const dx = Math.cos(ang) * dotR;
            const dy = -100 + Math.sin(ang) * dotR;
            return (
              <g key={i}>
                <line x1={0} y1={-100} x2={x2} y2={y2} stroke="#35CBFA" strokeWidth={2} opacity={0.3} />
                <circle cx={dx} cy={dy} r={5} fill="#9FE3FF" opacity={0.9} />
              </g>
            );
          })}
          {/* six orbiting portals */}
          {AGENT_COLORS.map((color, i) => {
            const ang = (i / 6) * Math.PI * 2 + (frame * Math.PI) / 180 * 0.14;
            const px = Math.cos(ang) * 330;
            const py = -100 + Math.sin(ang) * 330;
            const open = prog(frame, 40 + i * 18, 90 + i * 18, eOut);
            return (
              <g key={i} opacity={open}>
                <Glow x={px} y={py} r={110} color={color} opacity={0.3} />
                <circle cx={px} cy={py} r={54} fill="none" stroke={color} strokeWidth={6} />
                <circle cx={px} cy={py} r={34} fill={color} opacity={0.25} />
              </g>
            );
          })}
          <Core x={0} y={-100} r={coreR} color="#35CBFA" pulse={Math.sin(t * 3)} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: the six agents appear one by one, each with a role label + signature visual. */
const SixAgents: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.1, rot: 0}],
    [S3.len, {x: 0, y: 120, zoom: 1.0, rot: 0}],
  ]);
  const slot = S3.len / 6; // ~115 frames per agent
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Skyline lit={0.75} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-80} r={540} color="#35CBFA" opacity={0.1} />
          {AGENT_LOOKS.map((look, i) => {
            const start = i * slot;
            const appear = prog(frame, start + 5, start + 30, eOut);
            const color = AGENT_COLORS[i];
            // stagger role boxes vertically: 260 px boxes on 150 px spacing would overlap side by side
            const boxTop = i % 2 === 0 ? -440 : -310;
            const ax = AGENT_X[i];
            return (
              <g key={i} opacity={appear}>
                <Glow x={ax} y={-40} r={180} color={color} opacity={0.2} />
                {/* role label box */}
                <rect x={ax - 100} y={boxTop} width={200} height={70} rx={14} fill={C.charcoal} stroke={color} strokeWidth={4} />
                <Label x={ax} y={boxTop + 48} text={AGENT_NAMES[i]} size={32} color={C.bone} />
                {/* signature visual just above the agent's head (clear of the boxes) */}
                {i === 0 ? (
                  // research: scanning lines over a hologram panel
                  <g opacity={0.9}>
                    <rect x={ax - 55} y={-140} width={110} height={80} rx={10} fill="none" stroke={color} strokeWidth={3} />
                    {[0, 1, 2].map((l) => (
                      <line key={l} x1={ax - 44} y1={-120 + l * 24} x2={ax + 44} y2={-120 + l * 24} stroke={color} strokeWidth={4} opacity={0.7} />
                    ))}
                    <line x1={ax - 55} y1={-140 + ((frame * 2.2) % 80)} x2={ax + 55} y2={-140 + ((frame * 2.2) % 80)} stroke="#FFFFFF" strokeWidth={3} opacity={0.9} />
                  </g>
                ) : null}
                {i === 1 ? (
                  // strategy: floating data blocks
                  <g opacity={0.9}>
                    {[0, 1, 2].map((b) => (
                      <rect
                        key={b}
                        x={ax - 48 + b * 36}
                        y={-128 + Math.sin(t * 2 + b * 2.1) * 12}
                        width={28}
                        height={28}
                        rx={6}
                        fill="none"
                        stroke={color}
                        strokeWidth={3}
                      />
                    ))}
                  </g>
                ) : null}
                {i === 2 ? (
                  // coding: glowing code lines
                  <g opacity={0.9}>
                    {[0, 1, 2, 3].map((l) => (
                      <line key={l} x1={ax - 48} y1={-132 + l * 22} x2={ax - 48 + (28 + rand(l * 5 + i) * 54)} y2={-132 + l * 22} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
                    ))}
                  </g>
                ) : null}
                {i === 3 ? (
                  // execution: rotating gear
                  <g transform={`translate(${ax} -95) rotate(${frame * 1.6})`}>
                    <circle r={30} fill="none" stroke={color} strokeWidth={6} />
                    {[0, 1, 2, 3, 4, 5].map((g2) => (
                      <rect key={g2} x={-6} y={-46} width={12} height={18} rx={3} fill={color} transform={`rotate(${g2 * 60})`} />
                    ))}
                    <circle r={10} fill={color} />
                  </g>
                ) : null}
                {i === 4 ? (
                  // security: shield ring
                  <g opacity={0.9}>
                    <circle cx={ax} cy={-95} r={46} fill="none" stroke={color} strokeWidth={5} strokeDasharray="10 8" />
                    <circle cx={ax} cy={-95} r={26} fill={color} opacity={0.3} />
                  </g>
                ) : null}
                {i === 5 ? (
                  // coordination: neural lines to the other agents
                  <g opacity={0.85}>
                    {AGENT_X.slice(0, 5).map((ox, j) => (
                      <line key={j} x1={ax} y1={-110} x2={ox} y2={-70} stroke={color} strokeWidth={2.5} strokeDasharray="8 6" />
                    ))}
                    <circle cx={ax} cy={-110} r={9} fill={color} />
                  </g>
                ) : null}
                <Stickman x={ax} y={FLOOR} scale={1.0} facing={1} pose={idle(t, i * 1.7)} look={look} />
              </g>
            );
          })}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 4: all six connected to the core by glowing lines; city windows light up. */
const NetworkAwakens: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 0.98, rot: 0}],
    [S4.len, {x: 0, y: 60, zoom: 1.08, rot: 0}],
  ]);
  const lit = prog(frame, 0, S4.len, eInOut);
  const linkIn = prog(frame, 30, 150, eOut);
  const coreX = 0;
  const coreY = -170;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Skyline lit={lit} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* network lines: core -> each agent */}
          <g opacity={linkIn}>
            {AGENT_X.map((ax, i) => {
              const color = AGENT_COLORS[i];
              const hx = ax;
              const hy = FLOOR - 190; // chest height
              // pulse dot travelling core -> agent
              const pk = (t * 0.45 + i * 0.17) % 1;
              const px = coreX + (hx - coreX) * pk;
              const py = coreY + (hy - coreY) * pk;
              return (
                <g key={i}>
                  <line x1={coreX} y1={coreY} x2={hx} y2={hy} stroke={color} strokeWidth={3} opacity={0.55} />
                  <circle cx={px} cy={py} r={7} fill={color} opacity={0.95} />
                </g>
              );
            })}
          </g>
          <Core x={coreX} y={coreY} r={86} color="#35CBFA" pulse={Math.sin(t * 3)} />
          {AGENT_LOOKS.map((look, i) => (
            <Stickman key={i} x={AGENT_X[i]} y={FLOOR} scale={1.0} facing={1} pose={idle(t, i * 1.7)} look={look} expr="focused" />
          ))}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 5: a dark threat descends, agents activate, an energy wave dissolves it. */
const Revolution: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [S5.len, {x: 0, y: 120, zoom: 1.06, rot: 0}],
  ]);
  // threat descends frames 0-150, dissolves 280-420
  const ty = -900 + prog(frame, 0, 150, eInOut) * 560;
  const threatOp = 1 - prog(frame, 280, 420, eInOut);
  const threatScale = 1 + prog(frame, 280, 420, eInOut) * 0.35;
  const wave = prog(frame, 300, 430, eInOut);
  const activate = prog(frame, 150, 220, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Skyline lit={1} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* energy wave expanding from the center */}
          {wave > 0 ? (
            <g opacity={(1 - wave) * 0.85}>
              <circle cx={0} cy={-100} r={wave * 1050} fill="none" stroke="#35CBFA" strokeWidth={14} />
              <circle cx={0} cy={-100} r={wave * 900} fill="none" stroke="#E8C763" strokeWidth={9} />
            </g>
          ) : null}
          {/* the threat: dark spiky shape with a red glow */}
          <g transform={`translate(0 ${ty}) scale(${threatScale})`} opacity={threatOp}>
            <Glow x={0} y={0} r={260} color={C.red} opacity={0.35} />
            <polygon
              points="0,-150 90,-60 150,10 90,90 20,150 -60,120 -140,40 -110,-70"
              fill="#1A0A0A"
              stroke={C.red}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            <circle cx={0} cy={0} r={34} fill={C.red} opacity={0.8} />
          </g>
          {AGENT_LOOKS.map((look, i) => (
            <g key={i}>
              <Glow x={AGENT_X[i]} y={-40} r={170} color={AGENT_COLORS[i]} opacity={activate * (0.16 + 0.12 * Math.sin(t * 6 + i * 1.4))} />
              <Stickman x={AGENT_X[i]} y={FLOOR} scale={1.0} facing={1} pose={idle(t, i * 1.7)} look={look} expr={activate > 0.5 ? "determined" : "focused"} />
            </g>
          ))}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 6: pull back, six agents around the core, title card + drifting particles. */
const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 150, zoom: 1.12, rot: 0}],
    [S6.len, {x: 0, y: 150, zoom: 0.86, rot: 0}],
  ]);
  const titleIn = prog(frame, 10, 45, eOut);
  const subIn = prog(frame, 45, 75, eOut);
  const tagIn = prog(frame, 80, 115, eOut);
  const particles = Array.from({length: 22}).map((_, i) => {
    const seed = i * 17 + 3;
    const px = (rand(seed) - 0.5) * 1000;
    const py = 500 - ((frame * 0.9 + rand(seed + 1) * 900) % 1100);
    const tw = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.4 + i));
    return {x: px, y: py, r: 2 + rand(seed + 2) * 4, o: tw};
  });
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Skyline lit={1} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-220} r={560} color="#35CBFA" opacity={0.18} />
          {/* drifting particles */}
          {particles.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#9FE3FF" opacity={p.o} />
          ))}
          <Core x={0} y={-170} r={110} color="#35CBFA" pulse={Math.sin(t * 2.4)} />
          <g opacity={titleIn}>
            <Label x={0} y={-430} text="THE AGE OF INTELLIGENCE" size={76} color={C.bone} />
          </g>
          <g opacity={subIn}>
            <Label x={0} y={-350} text="EPISODE 01 — THE AWAKENING" size={42} color="#35CBFA" />
          </g>
          <g opacity={tagIn}>
            <Label x={0} y={-280} text="ONE NETWORK. SIX MINDS. INFINITE POSSIBILITIES." size={30} color={C.yellow} />
          </g>
          {AGENT_LOOKS.map((look, i) => (
            <Stickman key={i} x={AGENT_X[i]} y={FLOOR} scale={1.0} facing={1} pose={cheer(t, i * 1.3)} look={look} />
          ))}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

export const AgeOfIntelligence: React.FC = () => {
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
        <Silence />
      </Sequence>
      <Sequence from={S2.from} durationInFrames={S2.len}>
        <FirstAwakening />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <SixAgents />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <NetworkAwakens />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <Revolution />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <Finale />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
