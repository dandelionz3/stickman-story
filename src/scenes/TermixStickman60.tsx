import React, {useEffect, useState} from "react";
import {AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {eInOut, eOut, keysObj, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {cheer, idle, point} from "../rig/poses";
import {Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * TERMIX STICKMAN 60 (60 s, eight scenes) — a longer story:
 * one AI alone hits its limits -> a big project needs many skills ->
 * six specialized agents team up -> each role -> they check each
 * other's work -> TermiX. Dark background + TermiX neon green accent.
 * English captions, narration muxed in afterwards (ffmpeg).
 * Built by REUSE (TermixStickman structure, Stickman rig, CaptionTrack)
 * + RESKIN (new scenes, highlight pairs, juggling orbs, puzzle piece).
 */

export const TERMIX60_FRAMES = 1800;
const S1 = {from: 0, len: 210}; // 0-7 s    hook: one AI alone
const S2 = {from: 210, len: 240}; // 7-15 s   problem: juggling tasks
const S3 = {from: 450, len: 210}; // 15-22 s  team: six agents appear
const S4 = {from: 660, len: 240}; // 22-30 s  roles 1: Research + Strategy
const S5 = {from: 900, len: 210}; // 30-37 s  roles 2: Coding + Execution
const S6 = {from: 1110, len: 240}; // 37-45 s roles 3: Security + Coordination
const S7 = {from: 1350, len: 210}; // 45-52 s how it works: puzzle piece passes
const S8 = {from: 1560, len: 240}; // 52-60 s finish: cheer + TermiX

const CAPTIONS: CaptionCue[] = [
  {from: 15, to: 100, text: "One AI can help you."},
  {from: 110, to: 205, text: "But one AI working alone\nhas limits."},
  {from: 225, to: 330, text: "A big project needs research,\nplanning, code, shipping."},
  {from: 340, to: 445, text: "One mind can't do it all."},
  {from: 465, to: 565, text: "TermiX brings six specialized\nagents together."},
  {from: 575, to: 655, text: "One team. One shared mind."},
  {from: 675, to: 775, text: "The Research Agent finds\nwhat others miss."},
  {from: 785, to: 895, text: "The Strategy Agent\ncharts the path."},
  {from: 915, to: 1005, text: "The Coding Agent builds it."},
  {from: 1015, to: 1105, text: "The Execution Agent ships it."},
  {from: 1125, to: 1225, text: "The Security Agent guards it."},
  {from: 1235, to: 1345, text: "The Coordination Agent keeps\nevery piece moving in sync."},
  {from: 1365, to: 1465, text: "They check each other's work."},
  {from: 1475, to: 1555, text: "They verify. They finish\nwhat they start."},
  {from: 1575, to: 1795, text: "This is TermiX, a marketplace\nof specialized AI agents."},
];

const TEAM_LOOKS = [
  {...CASUAL, top: C.termix},
  JACKET_BLUE,
  SHIRT_ORANGE,
  {...CASUAL, top: C.cyan},
  {...CASUAL, top: C.yellow},
  {...CASUAL, top: "#7A5FBF"},
];
const TEAM_X = [-375, -225, -75, 75, 225, 375];
const ROLE_NAMES = ["Research", "Strategy", "Coding", "Execution", "Security", "Coordination"];

/** Scene 1: one stickman alone, worried, camera pushes in slowly. */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.1, rot: 0}],
    [S1.len, {x: 0, y: 120, zoom: 1.3, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-80} r={420} color={C.termix} opacity={0.14} />
          <Stickman x={0} y={FLOOR} scale={1.5} facing={1} pose={idle(t)} look={{...CASUAL, top: C.termix}} expr="worried" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const ORBS = [
  {color: C.termix, phase: 0},
  {color: C.orange, phase: 2.1},
  {color: C.cyan, phase: 4.2},
];

/** Scene 2: one stickman juggling three task orbs, stressed. */
const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.12, rot: 0}],
    [S2.len, {x: 0, y: 120, zoom: 1.18, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-80} r={420} color={C.red} opacity={0.1} />
          {ORBS.map((orb) => {
            const a = t * 2.4 + orb.phase;
            const ox = Math.sin(a) * 260;
            const oy = -140 - Math.abs(Math.sin(a)) * 330;
            return (
              <g key={orb.color}>
                <circle cx={ox} cy={oy} r={46} fill={orb.color} opacity={0.25} />
                <circle cx={ox} cy={oy} r={30} fill={orb.color} />
              </g>
            );
          })}
          <Stickman x={0} y={FLOOR} scale={1.5} facing={1} pose={idle(t)} look={{...CASUAL, top: C.termix}} expr="worried" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: six agents fade in one by one, standing as a team. */
const Team: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.08, rot: 0}],
    [S3.len, {x: 0, y: 120, zoom: 1.0, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-80} r={520} color={C.termix} opacity={0.1} />
          {TEAM_LOOKS.map((look, i) => {
            const appear = prog(frame, 8 + i * 26, 26 + i * 26, eOut);
            return (
              <Stickman
                key={i}
                x={TEAM_X[i]}
                y={FLOOR}
                scale={1.0}
                facing={1}
                pose={idle(t, i * 1.7)}
                look={look}
                opacity={appear}
              />
            );
          })}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scenes 4-6: two agents highlighted with role boxes, the rest dimmed. */
const RolePair: React.FC<{hi: [number, number]}> = ({hi}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.02, rot: 0}],
    [240, {x: 0, y: 120, zoom: 1.02, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-80} r={520} color={C.termix} opacity={0.08} />
          {TEAM_LOOKS.map((look, i) => {
            const isHi = hi.includes(i);
            const hiIdx = hi.indexOf(i);
            const appear = prog(frame, 6 + i * 10, 24 + i * 10, eOut);
            // Stagger the two role boxes vertically: the 150 px agent spacing
            // is narrower than one box, so side-by-side boxes overlap.
            const boxTop = hiIdx === 0 ? -420 : -275;
            return (
              <g key={i} opacity={appear}>
                {isHi && (
                  <g>
                    <Glow x={TEAM_X[i]} y={-40} r={190} color={C.termix} opacity={0.22} />
                    <rect x={TEAM_X[i] - 130} y={boxTop} width={260} height={84} rx={14} fill={C.charcoal} stroke={C.termix} strokeWidth={4} />
                    <Label x={TEAM_X[i]} y={boxTop + 56} text={ROLE_NAMES[i]} size={38} color={C.bone} />
                  </g>
                )}
                <Stickman
                  x={TEAM_X[i]}
                  y={FLOOR}
                  scale={isHi ? 1.12 : 0.92}
                  facing={1}
                  pose={idle(t, i * 1.7)}
                  look={look}
                  opacity={isHi ? 1 : 0.35}
                />
              </g>
            );
          })}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 7: a green puzzle piece travels across the team; each agent points as it passes. */
const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [S7.len, {x: 0, y: 120, zoom: 1.04, rot: 0}],
  ]);
  const travel = prog(frame, 10, S7.len - 10, eInOut); // 0..1 across the team
  const px = -420 + travel * 840;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={px} y={-120} r={260} color={C.termix} opacity={0.2} />
          {/* puzzle piece: rounded square + tab */}
          <g>
            <rect x={px - 55} y={-210} width={110} height={110} rx={18} fill={C.termix} />
            <circle cx={px} cy={-210} r={26} fill={C.termix} />
            <Label x={px} y={-138} text="✓" size={64} color={C.night} />
          </g>
          {TEAM_LOOKS.map((look, i) => {
            const pass = prog(frame, 10 + i * 30, 40 + i * 30, eOut); // 0..1 as piece passes
            const base = idle(t, i * 1.7);
            const pose = pass > 0 ? point(base, Math.min(1, pass * 2)) : base;
            return (
              <Stickman key={i} x={TEAM_X[i]} y={FLOOR} scale={1.0} facing={1} pose={pose} look={look} expr={pass >= 1 ? "happy" : "neutral"} />
            );
          })}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 8: the whole team cheers under the TermiX title. */
const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 150, zoom: 1.0, rot: 0}],
    [S8.len, {x: 0, y: 150, zoom: 1.06, rot: 0}],
  ]);
  const titleIn = prog(frame, 6, 30, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Wall x0={-1400} x1={1400} y0={-700} y1={FLOOR} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-220} r={520} color={C.termix} opacity={0.16} />
          <g opacity={titleIn}>
            <Label x={0} y={-300} text="TermiX" size={120} color={C.termix} />
            <Label x={0} y={-200} text="@termix_ai" size={52} color={C.bone} />
          </g>
          {TEAM_LOOKS.map((look, i) => (
            <Stickman key={i} x={TEAM_X[i]} y={FLOOR} scale={1.0} facing={1} pose={cheer(t, i * 1.3)} look={look} />
          ))}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

export const TermixStickman60: React.FC = () => {
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
        <Problem />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <Team />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <RolePair hi={[0, 1]} />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <RolePair hi={[2, 3]} />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <RolePair hi={[4, 5]} />
      </Sequence>
      <Sequence from={S7.from} durationInFrames={S7.len}>
        <HowItWorks />
      </Sequence>
      <Sequence from={S8.from} durationInFrames={S8.len}>
        <Finish />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
