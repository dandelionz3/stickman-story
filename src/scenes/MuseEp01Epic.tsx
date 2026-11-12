import React, {useEffect, useState} from "react";
import {AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from "remotion";
import {Camera2D, Layer} from "../camera/Camera2D";
import {CaptionCue, CaptionTrack} from "../captions/CaptionTrack";
import {Floor, FLOOR, Glow, Label} from "../environment/Furniture";
import {eOut, eInOut, keysObj, prog, rand} from "../motion/ease";
import {cheer, idle, mix, point, walk} from "../rig/poses";
import {Look, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";

/*
 * MUSE — EPISODE 01 (EPIC CUT): "HUMAN DAN MUSE"
 * 60 s, six scenes. Two leads, both consistent in every scene:
 *   - HUMAN: a stylised stickman (dark jacket + cap) = Abdul Aris / dandelionz.
 *   - MUSE: the REAL avatar image (public/muse-avatar-cutout.png) — the black
 *     furry character with glowing red eyes, white background removed
 *     procedurally (PIL luminance alpha + decontamination). NEVER redrawn.
 * Epic tone: huge scale, red glow, dramatic camera moves, heroic finale.
 * Indonesian captions; narration muxed in afterwards (ffmpeg, no -shortest).
 */

export const MUSE_EP01_EPIC_FRAMES = 1800;
const S1 = {from: 0, len: 300}; // 0-10 s   hook: human alone before a giant wall of tasks
const S2 = {from: 300, len: 300}; // 10-20 s  portal opens, the real Muse avatar appears
const S3 = {from: 600, len: 300}; // 20-30 s  meeting: human walks to Muse, they become partners
const S4 = {from: 900, len: 300}; // 30-40 s  action montage: schedule / ideas / messages / reminders
const S5 = {from: 1200, len: 300}; // 40-50 s  peak: side by side before a glowing horizon
const S6 = {from: 1500, len: 300}; // 50-60 s  title card: HUMAN DAN MUSE

const CAPTIONS: CaptionCue[] = [
  {from: 20, to: 280, text: "Sendirian, manusia\nhanya bisa sejauh ini."},
  {from: 320, to: 580, text: "Lalu datang Muse,\npersonal AI agent dari Meta.", size: 46},
  {from: 620, to: 880, text: "Bukan alat. Bukan sekadar\nchatbot. Dia partner.", size: 46},
  {from: 920, to: 1180, text: "Manusia bermimpi.\nMuse yang mewujudkan."},
  {from: 1220, to: 1480, text: "Dua pikiran.\nSatu misi."},
  {from: 1520, to: 1780, text: "Human dan Muse.\nEpisode 01."},
];

/** The human lead: dark jacket + cap, bone-white stickman. Same in every scene. */
const HUMAN: Look = {
  top: "#23262B",
  sleeve: "#23262B",
  coat: "#33383F",
  trousers: "#2E3135",
  hat: "cap",
  hatColor: "#1E1E22",
  headExtra: undefined,
};

const RED = "#FF2E2E";
const EMBER = "#FF7A1A";
const MUSE_BLUE = "#35CBFA";
/** Cutout aspect: 1423 x 1538. */
const AVATAR_AR = 1538 / 1423;
const AVATAR_SRC = staticFile("muse-avatar-cutout.png");

/**
 * The real Muse avatar image, centred on (cx, cy) at width w.
 * The cutout PNG already has the white background removed (alpha).
 */
const MuseAvatar: React.FC<{cx: number; cy: number; w: number; opacity?: number; glowR?: number}> = ({
  cx,
  cy,
  w,
  opacity = 1,
  glowR = 0,
}) => {
  const h = w * AVATAR_AR;
  return (
    <g opacity={opacity}>
      {glowR > 0 ? <Glow x={cx} y={cy} r={glowR} color={RED} opacity={0.3} /> : null}
      <image href={AVATAR_SRC} x={cx - w / 2} y={cy - h / 2} width={w} height={h} />
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

/** Falling embers — red/orange sparks drifting down. */
const Embers: React.FC<{frame: number; n?: number; area?: number}> = ({frame, n = 26, area = 1000}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const seed = i * 31 + 5;
      const px = (rand(seed) - 0.5) * area;
      const py = -760 + ((frame * (1.6 + rand(seed + 1) * 2.4) + rand(seed + 2) * 1500) % 1500);
      const drift = Math.sin(frame * 0.02 + i) * 22;
      const tw = 0.3 + 0.6 * Math.abs(Math.sin(frame * 0.05 + i * 2.1));
      return (
        <circle
          key={i}
          cx={px + drift}
          cy={py}
          r={2 + rand(seed + 3) * 3.5}
          fill={i % 3 === 0 ? EMBER : RED}
          opacity={tw}
        />
      );
    })}
  </g>
);

/** Scene 1: the human stands small before a giant dark wall of tasks. */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 0.92, rot: 0}],
    [S1.len, {x: 0, y: 140, zoom: 1.06, rot: 0}],
  ]);
  const wallIn = prog(frame, 0, 60, eOut);
  const bars = [0, 1, 2, 3, 4, 5];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0D0708">
        <Layer depth={0.5}>
          <Stars t={t} />
          <Embers frame={frame} />
        </Layer>
        <Layer depth={1}>
          {/* giant monolith of tasks looming over the human */}
          <g opacity={wallIn}>
            <rect x={-120} y={-760} width={640} height={1080} rx={26} fill="#101216" stroke={RED} strokeWidth={5} opacity={0.9} />
            <rect x={-120} y={-760} width={640} height={1080} rx={26} fill="none" stroke={RED} strokeWidth={2} opacity={0.25} />
            {bars.map((b) => (
              <g key={b} opacity={prog(frame, 30 + b * 22, 70 + b * 22, eOut)}>
                <rect x={-70} y={-690 + b * 92} width={420 + (b % 2 === 0 ? 60 : -40)} height={44} rx={10} fill="#1C1F24" stroke="#3A3F47" strokeWidth={2} />
                <rect x={-70} y={-690 + b * 92} width={14} height={44} rx={7} fill={RED} opacity={0.85} />
              </g>
            ))}
            {/* warning mark on the wall */}
            <g transform="translate(200 -420)" opacity={prog(frame, 160, 210, eOut)}>
              <polygon points="0,-52 46,32 -46,32" fill="none" stroke={EMBER} strokeWidth={6} strokeLinejoin="round" />
              <line x1={0} y1={-26} x2={0} y2={6} stroke={EMBER} strokeWidth={7} strokeLinecap="round" />
              <circle cx={0} cy={20} r={4.5} fill={EMBER} />
            </g>
          </g>
          <Glow x={200} y={-200} r={420} color={RED} opacity={0.1} />
          <Floor x0={-1400} x1={1400} />
          <Stickman x={-330} y={FLOOR} scale={0.92} facing={1} pose={idle(t, 0)} look={HUMAN} expr="worried" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: a burning portal opens and the real Muse avatar appears. */
const Portal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.14, rot: 0}],
    [S2.len, {x: 0, y: 120, zoom: 1.0, rot: 0}],
  ]);
  const ringIn = prog(frame, 0, 50, eOut);
  const appear = prog(frame, 40, 130, eOut);
  const scale = 0.15 + 0.85 * appear;
  const bob = Math.sin(t * 2.1) * 12;
  const labelIn = prog(frame, 150, 190, eOut);
  const factIn = prog(frame, 190, 230, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0D0708">
        <Layer depth={0.5}>
          <Stars t={t} />
          <Embers frame={frame} n={18} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* portal rings */}
          <g opacity={ringIn}>
            <Glow x={0} y={-90} r={460} color={RED} opacity={0.28} />
            <circle cx={0} cy={-90} r={300} fill="none" stroke={RED} strokeWidth={10} opacity={0.85} />
            <circle
              cx={0}
              cy={-90}
              r={340}
              fill="none"
              stroke={EMBER}
              strokeWidth={4}
              strokeDasharray="26 18"
              opacity={0.7}
              transform={`rotate(${frame * 0.35} 0 -90)`}
            />
            <circle cx={0} cy={-90} r={262} fill={RED} opacity={0.08} />
          </g>
          {/* the real avatar, scaling out of the portal */}
          <g transform={`translate(0 ${-90 + bob}) scale(${scale})`}>
            <MuseAvatar cx={0} cy={0} w={400} opacity={appear} glowR={330} />
          </g>
          <g opacity={labelIn}>
            <Label x={0} y={230} text="MUSE" size={46} color={RED} />
          </g>
          <g opacity={factIn}>
            <Label x={0} y={290} text="Meta  •  Muse Spark" size={26} color="#9AA0A8" />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: the human walks up to Muse — partners, not tool and user. */
const Meeting: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [S3.len, {x: 0, y: 120, zoom: 1.07, rot: 0}],
  ]);
  const walkK = prog(frame, 10, 150, eInOut);
  const humanX = -430 + walkK * 200;
  const moving = frame < 170;
  const pose = moving ? mix(walk(frame * 0.45, t), idle(t, 0), prog(frame, 140, 175, eOut)) : point(idle(t, 0), prog(frame, 175, 215, eOut));
  const spark = prog(frame, 175, 215, eOut);
  const ringR = 10 + spark * 90;
  const labelIn = prog(frame, 210, 250, eOut);
  const bob = Math.sin(t * 2.1) * 10;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* dashed link between the two, then the spark of the meeting */}
          <g opacity={prog(frame, 150, 200, eOut)}>
            <line x1={-200} y1={200} x2={55} y2={240} stroke={RED} strokeWidth={3} strokeDasharray="12 10" opacity={0.55} />
          </g>
          <g opacity={spark} transform={`translate(-30 210)`}>
            <Glow x={0} y={0} r={130} color={EMBER} opacity={0.5} />
            <circle cx={0} cy={0} r={ringR} fill="none" stroke={EMBER} strokeWidth={5} opacity={1 - spark * 0.6} />
            <polygon points="0,-26 7,-7 26,0 7,7 0,26 -7,7 -26,0 -7,-7" fill="#FFFFFF" opacity={0.95} />
          </g>
          <Stickman x={humanX} y={FLOOR} scale={1.0} facing={1} pose={pose} look={HUMAN} expr={moving ? "determined" : "happy"} />
          <g transform={`translate(0 ${bob})`}>
            <MuseAvatar cx={205} cy={258} w={300} glowR={260} />
          </g>
          <g opacity={labelIn}>
            <Label x={0} y={-330} text="PARTNER" size={44} color={RED} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** One action icon: calendar / bulb / message / bell, cyan on dark. */
const ActionIcon: React.FC<{kind: number}> = ({kind}) => {
  const stroke = MUSE_BLUE;
  const sw = 5;
  if (kind === 0) {
    // calendar — JADWAL
    return (
      <g stroke={stroke} strokeWidth={sw} fill="none">
        <rect x={-55} y={-50} width={110} height={100} rx={12} />
        <line x1={-55} y1={-18} x2={55} y2={-18} />
        <line x1={-28} y1={-62} x2={-28} y2={-38} strokeLinecap="round" />
        <line x1={28} y1={-62} x2={28} y2={-38} strokeLinecap="round" />
        {[0, 1, 2].map((r) => (
          <circle key={r} cx={-28 + r * 28} cy={14} r={6} fill={stroke} stroke="none" />
        ))}
      </g>
    );
  }
  if (kind === 1) {
    // lightbulb — IDE
    return (
      <g stroke={stroke} strokeWidth={sw} fill="none">
        <circle cx={0} cy={-8} r={42} />
        <line x1={-16} y1={40} x2={16} y2={40} strokeLinecap="round" />
        <line x1={-12} y1={54} x2={12} y2={54} strokeLinecap="round" />
        {[0, 1, 2, 3].map((r) => {
          const ang = -Math.PI / 2 + (r - 1.5) * 0.7;
          return <line key={r} x1={Math.cos(ang) * 58} y1={-8 + Math.sin(ang) * 58} x2={Math.cos(ang) * 72} y2={-8 + Math.sin(ang) * 72} strokeLinecap="round" />;
        })}
      </g>
    );
  }
  if (kind === 2) {
    // message bubble — PESAN
    return (
      <g stroke={stroke} strokeWidth={sw} fill="none">
        <rect x={-58} y={-48} width={116} height={84} rx={16} />
        <polygon points="-28,36 -28,62 6,36" fill={stroke} stroke="none" />
        <line x1={-38} y1={-22} x2={38} y2={-22} strokeLinecap="round" />
        <line x1={-38} y1={2} x2={14} y2={2} strokeLinecap="round" />
      </g>
    );
  }
  // bell — INGAT
  return (
    <g stroke={stroke} strokeWidth={sw} fill="none">
      <path d="M -42 22 A 42 42 0 0 1 42 22 L 42 30 L -42 30 Z" />
      <circle cx={0} cy={46} r={8} fill={stroke} stroke="none" />
      <line x1={-52} y1={-52} x2={-40} y2={-40} strokeLinecap="round" />
      <line x1={52} y1={-52} x2={40} y2={-40} strokeLinecap="round" />
    </g>
  );
};

/** Scene 4: action montage — the four powers land one by one, dramatically. */
const Montage: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.03, rot: 0}],
    [S4.len, {x: 0, y: 120, zoom: 0.95, rot: 0}],
  ]);
  const icons = [
    {x: -360, at: 10, label: "JADWAL"},
    {x: -120, at: 70, label: "IDE"},
    {x: 120, at: 130, label: "PESAN"},
    {x: 360, at: 190, label: "INGAT"},
  ];
  const bob = Math.sin(t * 2.1) * 10;
  const cheering = frame > 230;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Layer depth={0.5}>
          <Stars t={t} />
          <Embers frame={frame} n={14} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {icons.map((ic, i) => {
            const a = prog(frame, ic.at, ic.at + 35, eOut);
            const sc = 0.3 + 0.7 * a;
            const bobY = Math.sin(t * 2 + i * 1.8) * 8;
            return (
              <g key={i} opacity={a} transform={`translate(${ic.x} ${-280 + bobY}) scale(${sc})`}>
                <Glow x={0} y={0} r={150} color={MUSE_BLUE} opacity={0.25} />
                <ActionIcon kind={i} />
                <Label x={0} y={115} text={ic.label} size={30} color={C.bone} />
              </g>
            );
          })}
          <Stickman
            x={-170}
            y={FLOOR}
            scale={1.0}
            facing={1}
            pose={cheering ? cheer(t, 0) : idle(t, 0)}
            look={HUMAN}
            expr="happy"
          />
          <g transform={`translate(0 ${bob})`}>
            <MuseAvatar cx={215} cy={269} w={280} glowR={240} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 5: peak — side by side before a glowing horizon city. */
const Peak: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.1, rot: 0}],
    [S5.len, {x: 0, y: 120, zoom: 0.93, rot: 0}],
  ]);
  const sunRise = prog(frame, 0, 120, eOut);
  const bob = Math.sin(t * 2.1) * 10;
  const buildings = [
    {x: -520, w: 120, h: 300},
    {x: -380, w: 90, h: 210},
    {x: -260, w: 130, h: 340},
    {x: -100, w: 100, h: 240},
    {x: 40, w: 140, h: 380},
    {x: 210, w: 90, h: 260},
    {x: 330, w: 130, h: 330},
    {x: 480, w: 100, h: 220},
  ];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#160A0C">
        <Layer depth={0.4}>
          <Stars t={t} />
          {/* rising sun on the horizon */}
          <g opacity={sunRise}>
            <Glow x={180} y={60} r={520} color={EMBER} opacity={0.4} />
            <circle cx={180} cy={60} r={150} fill={EMBER} opacity={0.85} />
            <circle cx={180} cy={60} r={110} fill="#FFD23C" opacity={0.9} />
          </g>
        </Layer>
        <Layer depth={0.7}>
          {/* city skyline silhouette */}
          {buildings.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={FLOOR - b.h} width={b.w} height={b.h} fill="#0A0A0C" />
              {Array.from({length: Math.floor(b.h / 46)}).map((_, r) =>
                Array.from({length: Math.floor(b.w / 34)}).map((_, c) => {
                  const lit = rand(i * 91 + r * 7 + c * 3) > 0.55;
                  return lit ? (
                    <rect key={`${r}-${c}`} x={b.x + 12 + c * 34} y={FLOOR - b.h + 16 + r * 46} width={12} height={16} fill="#FFD23C" opacity={0.85} />
                  ) : null;
                }),
              )}
            </g>
          ))}
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={100} r={380} color={EMBER} opacity={0.12} />
          <Stickman x={-280} y={FLOOR} scale={1.0} facing={1} pose={idle(t, 0)} look={HUMAN} expr="determined" />
          <g transform={`translate(0 ${bob})`}>
            <MuseAvatar cx={60} cy={258} w={300} glowR={260} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 6: title card — both leads cheering under the title. */
const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 150, zoom: 1.12, rot: 0}],
    [S6.len, {x: 0, y: 150, zoom: 0.92, rot: 0}],
  ]);
  const titleIn = prog(frame, 10, 45, eOut);
  const subIn = prog(frame, 45, 75, eOut);
  const tagIn = prog(frame, 80, 115, eOut);
  const factIn = prog(frame, 120, 160, eOut);
  const bob = Math.sin(t * 2.1) * 14;
  const pulse = 1 + Math.sin(t * 2.4) * 0.02;
  const particles = Array.from({length: 26}).map((_, i) => {
    const seed = i * 17 + 3;
    const px = (rand(seed) - 0.5) * 1000;
    const py = 500 - ((frame * 0.9 + rand(seed + 1) * 900) % 1100);
    const tw = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.4 + i));
    return {x: px, y: py, r: 2 + rand(seed + 2) * 4, o: tw, red: i % 3 === 0};
  });
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0D0708">
        <Layer depth={0.5}>
          <Stars t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-140} r={540} color={RED} opacity={0.18} />
          {particles.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.red ? RED : "#9FE3FF"} opacity={p.o} />
          ))}
          <g opacity={titleIn}>
            <Label x={0} y={-640} text="HUMAN DAN MUSE" size={84} color={C.bone} />
          </g>
          <g opacity={subIn}>
            <Label x={0} y={-556} text="AI YANG MENGENALMU" size={38} color={RED} />
          </g>
          <g opacity={tagIn}>
            <Label x={0} y={-496} text="EPISODE 01" size={34} color={C.yellow} />
          </g>
          <g transform={`translate(0 ${-140 + bob}) scale(${pulse})`}>
            <MuseAvatar cx={0} cy={0} w={400} glowR={330} />
          </g>
          <Stickman x={0} y={FLOOR} scale={1.0} facing={1} pose={cheer(t, 0)} look={HUMAN} expr="happy" />
          <g opacity={factIn}>
            <Label x={0} y={-730} text="Meta  •  Muse Spark  •  sejak 8 Sep 2026" size={24} color="#8A9199" />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

export const MuseEp01Epic: React.FC = () => {
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
        <Portal />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <Meeting />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <Montage />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <Peak />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <Finale />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
