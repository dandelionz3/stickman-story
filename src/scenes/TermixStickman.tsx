import React, {useEffect, useState} from "react";
import {AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {eInOut, eOut, keysObj, prog} from "../motion/ease";
import {CASUAL, JACKET_BLUE, SHIRT_ORANGE} from "../rig/looks";
import {cheer, idle} from "../rig/poses";
import {Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * TERMIX STICKMAN (30 s, four scenes) — "One AI can help you.
 * Six AIs working as a team can finish a whole project."
 * Dark background + TermiX neon green accent. English captions, no narration.
 * Built by REUSE (Example03 structure, Stickman rig, CaptionTrack) + RESKIN
 * (TermiX green, six reskinned looks, role boxes).
 */

export const TERMIX_FRAMES = 900;
const S1 = {from: 0, len: 210}; // 0-7 s   hook: one AI
const S2 = {from: 210, len: 240}; // 7-15 s  team: six agents appear
const S3 = {from: 450, len: 240}; // 15-23 s roles: six role boxes
const S4 = {from: 690, len: 210}; // 23-30 s finish: cheer + TermiX

const CAPTIONS: CaptionCue[] = [
  {from: 15, to: 105, text: "One AI can help you."},
  {from: 115, to: 205, text: "Six AIs working as a team\ncan finish a whole project."},
  {from: 225, to: 445, text: "Six specialized agents.\nOne shared mind."},
  {from: 465, to: 685, text: "Six roles. One team."},
  {from: 705, to: 895, text: "This is TermiX — a marketplace\nof specialized AI agents."},
];

const SCALE = 1.5;

/** Scene 1: one stickman alone, camera pushes in slowly. */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.1, rot: 0}],
    [S1.len, {x: 0, y: 120, zoom: 1.28, rot: 0}],
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
          <Stickman x={0} y={FLOOR} scale={SCALE} facing={1} pose={idle(t)} look={{...CASUAL, top: C.termix}} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const TEAM_LOOKS = [
  {...CASUAL, top: C.termix},
  JACKET_BLUE,
  SHIRT_ORANGE,
  {...CASUAL, top: C.cyan},
  {...CASUAL, top: C.yellow},
  {...CASUAL, top: "#7A5FBF"},
];
const TEAM_X = [-375, -225, -75, 75, 225, 375];

/** Scene 2: six agents fade in one by one, standing as a team. */
const Team: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.05, rot: 0}],
    [S2.len, {x: 0, y: 120, zoom: 1.0, rot: 0}],
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

const ROLES = ["Research", "Strategy", "Coding", "Execution", "Security", "Coordination"];

/** Scene 3: the six roles appear as boxes, two rows of three. */
const Roles: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
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
          <Glow x={0} y={-200} r={480} color={C.termix} opacity={0.1} />
          <g>
            {ROLES.map((label, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const bx = -340 + col * 340;
              const by = -280 + row * 170;
              const appear = prog(frame, 10 + i * 22, 30 + i * 22, eInOut);
              return (
                <g key={label} opacity={appear}>
                  <rect x={bx - 150} y={by - 55} width={300} height={110} rx={16} fill={C.charcoal} stroke={C.termix} strokeWidth={5} />
                  <Label x={bx} y={by + 14} text={label} size={42} color={C.bone} />
                </g>
              );
            })}
          </g>
          <Stickman x={0} y={FLOOR} scale={1.1} facing={1} pose={idle(t)} look={{...CASUAL, top: C.termix}} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 4: the whole team cheers under the TermiX title. */
const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 150, zoom: 1.0, rot: 0}],
    [S4.len, {x: 0, y: 150, zoom: 1.06, rot: 0}],
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

export const TermixStickman: React.FC = () => {
  // Wait for the vendored Inter font before the first frame renders.
  const [handle] = useState(() => delayRender());
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) continueRender(handle);
    };
    if (typeof document !== "undefined" && document.fonts) {
      Promise.all([document.fonts.load('800 54px Inter'), document.fonts.load('700 54px Inter')])
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
        <Team />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <Roles />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <Finish />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
