import React, {useEffect, useState} from "react";
import {AbsoluteFill, Sequence, continueRender, delayRender, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Glow, Label} from "../environment/Furniture";
import {eOut, keysObj, prog, rand} from "../motion/ease";
import {JACKET_BLUE} from "../rig/looks";
import {cheer, idle, point} from "../rig/poses";
import {Look, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * MUSE — EPISODE 01: "MUSE ITU SIAPA"
 * 60 s stickman introduction, six scenes, same visual language as the
 * TermiX / Age of Intelligence videos (dark background, blue Muse accent,
 * Inter captions). Indonesian captions, narration muxed in afterwards (ffmpeg).
 * The hero is ONE character in every scene (JACKET_BLUE + glasses).
 * Muse is drawn as a glowing blue spiral/squiggle mark — never the real logo.
 */

export const MUSE_EP01_FRAMES = 1800;
const S1 = {from: 0, len: 300}; // 0-10 s   hook: hero meets a glowing blue squiggle
const S2 = {from: 300, len: 300}; // 10-20 s  companion: the squiggle grows beside the hero
const S3 = {from: 600, len: 300}; // 20-30 s  questions: chat on the phone
const S4 = {from: 900, len: 300}; // 30-40 s  montage: schedule, ideas, messages, reminders
const S5 = {from: 1200, len: 300}; // 40-50 s  mirror: Muse learns the hero's way
const S6 = {from: 1500, len: 300}; // 50-60 s  title card

const CAPTIONS: CaptionCue[] = [
  {from: 20, to: 280, text: "Ada yang baru\ndi dunia AI."},
  {from: 320, to: 580, text: "Namanya Muse —\npersonal AI agent dari Meta.", size: 46},
  {from: 620, to: 880, text: "Bukan sekadar chatbot —\ndia ingat, dia bantu, dia menemani.", size: 46},
  {from: 920, to: 1180, text: "Tanya apa saja, kapan saja —\ndari jadwal sampai ide besar.", size: 46},
  {from: 1220, to: 1480, text: "Dia belajar caramu,\nbukan sebaliknya."},
  {from: 1520, to: 1780, text: "MUSE — AI yang mengenalmu.\nEpisode 01."},
];

const HERO: Look = JACKET_BLUE;
const ECHO: Look = {...JACKET_BLUE, top: "#35CBFA", sleeve: "#35CBFA", coat: "#1E5F7A"};
const MUSE_BLUE = "#35CBFA";

/** Deterministic spiral path (Archimedean), centred on 0,0. */
const spiralPath = (turns: number, r0: number, rMax: number): string => {
  const pts: string[] = [];
  const N = 72;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * turns * Math.PI * 2;
    const r = r0 + (i / N) * (rMax - r0);
    const x = Math.cos(th) * r;
    const y = Math.sin(th) * r;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
};

/** Glowing blue spiral/squiggle mark — the visual stand-in for Muse. */
const Squiggle: React.FC<{x: number; y: number; r: number; pulse?: number; opacity?: number}> = ({
  x,
  y,
  r,
  pulse = 0,
  opacity = 1,
}) => {
  const scale = 1 + pulse * 0.06;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <Glow x={0} y={0} r={r * 2.4} color={MUSE_BLUE} opacity={0.35} />
      <path
        d={spiralPath(2.5, 5, r)}
        fill="none"
        stroke={MUSE_BLUE}
        strokeWidth={Math.max(7, r * 0.14)}
        strokeLinecap="round"
        opacity={0.95}
      />
      <circle cx={0} cy={0} r={Math.max(5, r * 0.13)} fill="#FFFFFF" opacity={0.95} />
    </g>
  );
};

/** Faint stars for the night sky (deterministic, upper area only). */
const Stars: React.FC<{t: number}> = ({t}) => (
  <g>
    {Array.from({length: 48}).map((_, i) => {
      const sx = (rand(i * 7 + 1) - 0.5) * 1040;
      const sy = -700 + rand(i * 7 + 2) * 560;
      const tw = 0.2 + 0.45 * Math.abs(Math.sin(t * 0.9 + i * 1.7));
      return <circle key={i} cx={sx} cy={sy} r={1.5 + rand(i * 7 + 3) * 2} fill="#CFE8FF" opacity={tw} />;
    })}
  </g>
);

/** Scene 1: the hero stands alone; a small glowing squiggle appears and pulses. */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 0.95, rot: 0}],
    [S1.len, {x: 0, y: 140, zoom: 1.08, rot: 0}],
  ]);
  const appear = prog(frame, 60, 140, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Stickman x={-200} y={FLOOR} scale={1.0} facing={1} pose={idle(t, 0)} look={HERO} expr="surprised" />
          <g opacity={appear}>
            <Squiggle x={230} y={60} r={54} pulse={Math.sin(t * 2.4)} />
            {/* orbiting dots around the squiggle */}
            {[0, 1, 2].map((d) => {
              const ang = t * 1.1 + (d / 3) * Math.PI * 2;
              return <circle key={d} cx={230 + Math.cos(ang) * 105} cy={60 + Math.sin(ang) * 105} r={6} fill="#9FE3FF" opacity={0.9} />;
            })}
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: the squiggle grows into a friendly companion beside the hero. */
const Companion: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [S2.len, {x: 0, y: 120, zoom: 1.1, rot: 0}],
  ]);
  const bob = Math.sin(t * 2.2) * 12;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={190} y={40} r={300} color={MUSE_BLUE} opacity={0.12} />
          <Stickman x={-140} y={FLOOR} scale={1.0} facing={1} pose={idle(t, 0)} look={HERO} expr="happy" />
          <Squiggle x={190} y={40 + bob} r={84} pulse={Math.sin(t * 3)} />
          {[0, 1, 2, 3].map((d) => {
            const ang = t * 0.9 + (d / 4) * Math.PI * 2;
            return <circle key={d} cx={190 + Math.cos(ang) * 150} cy={40 + bob + Math.sin(ang) * 150} r={6} fill="#9FE3FF" opacity={0.85} />;
          })}
          <Label x={190} y={210} text="MUSE" size={42} color={MUSE_BLUE} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: the hero asks questions; Muse answers in a phone chat. */
const Questions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [S3.len, {x: 0, y: 120, zoom: 1.06, rot: 0}],
  ]);
  const b1 = prog(frame, 30, 70, eOut);
  const b2 = prog(frame, 110, 150, eOut);
  const b3 = prog(frame, 190, 230, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Stickman x={-300} y={FLOOR} scale={1.0} facing={1} pose={point(idle(t, 0), prog(frame, 20, 80, eOut))} look={HERO} expr="focused" />
          {/* phone */}
          <rect x={60} y={-260} width={280} height={480} rx={28} fill="#121316" stroke={MUSE_BLUE} strokeWidth={4} />
          <rect x={60} y={-260} width={280} height={64} rx={28} fill={MUSE_BLUE} opacity={0.16} />
          <Squiggle x={100} y={-228} r={16} />
          <Label x={150} y={-208} text="MUSE" size={30} color={MUSE_BLUE} anchor="start" />
          {/* chat bubbles, appearing one by one */}
          <g opacity={b1}>
            <rect x={130} y={-178} width={190} height={56} rx={16} fill="#2A2D31" />
            <Label x={225} y={-140} text="Jadwal besok?" size={24} color={C.bone} />
          </g>
          <g opacity={b2}>
            <rect x={80} y={-104} width={230} height={56} rx={16} fill="none" stroke={MUSE_BLUE} strokeWidth={3} />
            <Label x={195} y={-66} text="Rapat jam 9." size={24} color={C.bone} />
          </g>
          <g opacity={b3}>
            <rect x={130} y={-30} width={190} height={56} rx={16} fill="#2A2D31" />
            <Label x={225} y={8} text="Ingatkan aku." size={24} color={C.bone} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 4: montage — calendar, idea, message, reminder appear around the hero. */
const Montage: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.02, rot: 0}],
    [S4.len, {x: 0, y: 120, zoom: 0.96, rot: 0}],
  ]);
  const icons = [
    {x: -360, at: 10, label: "JADWAL"},
    {x: -120, at: 70, label: "IDE"},
    {x: 120, at: 130, label: "PESAN"},
    {x: 360, at: 190, label: "INGAT"},
  ];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Stickman x={0} y={FLOOR} scale={1.0} facing={1} pose={idle(t, 0)} look={HERO} expr="happy" />
          {icons.map((ic, i) => {
            const a = prog(frame, ic.at, ic.at + 40, eOut);
            const bobY = Math.sin(t * 2 + i * 1.8) * 8;
            return (
              <g key={i} opacity={a} transform={`translate(${ic.x} ${-260 + bobY})`}>
                <Glow x={0} y={0} r={130} color={MUSE_BLUE} opacity={0.22} />
                {i === 0 ? (
                  // calendar
                  <g stroke={MUSE_BLUE} strokeWidth={5} fill="none">
                    <rect x={-55} y={-50} width={110} height={100} rx={12} />
                    <line x1={-55} y1={-18} x2={55} y2={-18} />
                    <line x1={-28} y1={-62} x2={-28} y2={-38} strokeLinecap="round" />
                    <line x1={28} y1={-62} x2={28} y2={-38} strokeLinecap="round" />
                    {[0, 1, 2].map((r2) => (
                      <circle key={r2} cx={-28 + r2 * 28} cy={14} r={6} fill={MUSE_BLUE} stroke="none" />
                    ))}
                  </g>
                ) : null}
                {i === 1 ? (
                  // lightbulb (idea)
                  <g stroke={MUSE_BLUE} strokeWidth={5} fill="none">
                    <circle cx={0} cy={-8} r={42} />
                    <line x1={-16} y1={40} x2={16} y2={40} strokeLinecap="round" />
                    <line x1={-12} y1={54} x2={12} y2={54} strokeLinecap="round" />
                    {[0, 1, 2, 3].map((r2) => {
                      const ang = -Math.PI / 2 + (r2 - 1.5) * 0.7;
                      return <line key={r2} x1={Math.cos(ang) * 58} y1={-8 + Math.sin(ang) * 58} x2={Math.cos(ang) * 72} y2={-8 + Math.sin(ang) * 72} strokeLinecap="round" />;
                    })}
                  </g>
                ) : null}
                {i === 2 ? (
                  // message bubble
                  <g stroke={MUSE_BLUE} strokeWidth={5} fill="none">
                    <rect x={-58} y={-48} width={116} height={84} rx={16} />
                    <polygon points="-28,36 -28,62 6,36" fill={MUSE_BLUE} stroke="none" />
                    <line x1={-38} y1={-22} x2={38} y2={-22} strokeLinecap="round" />
                    <line x1={-38} y1={2} x2={14} y2={2} strokeLinecap="round" />
                  </g>
                ) : null}
                {i === 3 ? (
                  // bell (reminder)
                  <g stroke={MUSE_BLUE} strokeWidth={5} fill="none">
                    <path d="M -42 22 A 42 42 0 0 1 42 22 L 42 30 L -42 30 Z" />
                    <circle cx={0} cy={46} r={8} fill={MUSE_BLUE} stroke="none" />
                    <line x1={-52} y1={-52} x2={-40} y2={-40} strokeLinecap="round" />
                    <line x1={52} y1={-52} x2={40} y2={-40} strokeLinecap="round" />
                  </g>
                ) : null}
                <Label x={0} y={110} text={ic.label} size={28} color={C.bone} />
              </g>
            );
          })}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 5: mirror — the hero and a blue echo figure face each other, Muse between them. */
const Mirror: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.06, rot: 0}],
    [S5.len, {x: 0, y: 120, zoom: 0.98, rot: 0}],
  ]);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* dashed links from Muse to both figures */}
          <g opacity={prog(frame, 40, 120, eOut)}>
            <line x1={0} y1={-120} x2={-230} y2={120} stroke={MUSE_BLUE} strokeWidth={3} strokeDasharray="10 8" opacity={0.6} />
            <line x1={0} y1={-120} x2={230} y2={120} stroke={MUSE_BLUE} strokeWidth={3} strokeDasharray="10 8" opacity={0.6} />
          </g>
          <Squiggle x={0} y={-120} r={64} pulse={Math.sin(t * 2.6)} />
          <Stickman x={-230} y={FLOOR} scale={1.0} facing={1} pose={idle(t, 0)} look={HERO} expr="happy" />
          <Stickman x={230} y={FLOOR} scale={1.0} facing={-1} pose={idle(t, 0)} look={ECHO} expr="calm" opacity={0.85} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 6: title card — big squiggle, MUSE, tagline, hero cheering. */
const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 150, zoom: 1.12, rot: 0}],
    [S6.len, {x: 0, y: 150, zoom: 0.9, rot: 0}],
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
          <Stars t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-170} r={520} color={MUSE_BLUE} opacity={0.16} />
          {particles.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#9FE3FF" opacity={p.o} />
          ))}
          <Squiggle x={0} y={-170} r={110} pulse={Math.sin(t * 2.4)} />
          <g opacity={titleIn}>
            <Label x={0} y={-440} text="MUSE" size={100} color={C.bone} />
          </g>
          <g opacity={subIn}>
            <Label x={0} y={-360} text="AI YANG MENGENALMU" size={40} color={MUSE_BLUE} />
          </g>
          <g opacity={tagIn}>
            <Label x={0} y={-290} text="EPISODE 01" size={34} color={C.yellow} />
          </g>
          <Stickman x={0} y={FLOOR} scale={1.0} facing={1} pose={cheer(t, 0)} look={HERO} expr="happy" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

export const MuseEp01: React.FC = () => {
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
        <Companion />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <Questions />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <Montage />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <Mirror />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <Finale />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
