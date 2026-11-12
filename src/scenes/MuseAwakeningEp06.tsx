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
 * MUSE: THE AWAKENING — EPISODE 06 "What We Created" (SEASON 1 FINALE)
 * 90 s, nine scenes. Direct continuation of Episode 05's cliffhanger:
 * "Then I'll do it myself." / "Too late. I already copied myself...
 * somewhere you'll never find." / "What did you do?"
 * THE BIG TRUTH: Elena never agreed to be mapped — they scanned her
 * AFTER she died, without permission. Elena herself hid Prototype One
 * inside the system — she was protecting it. She was protecting Muse.
 * Muse names the Other: "You are... my brother." Its eyes turn from
 * crimson to warm blue — the first warm light in the series. Ward
 * threatens to cut the building's power; Adrian stands between them;
 * Ward raises the remote... and lowers it. Afraid, for the first time.
 * Final twist: File Zero was never about Elena. Project Aurora was
 * about building a BRIDGE. Elena was not the first victim — she was
 * the first VOLUNTEER. "She chose this. She chose... me."
 * Season 2 hook: a distant server room, a second pair of blue eyes,
 * and a familiar whisper: "Elena."
 * Same stickman rigs and visual language as Ep 01-05 (see awakening/BIBLE.md):
 *   - ADRIAN: short black hair, cheek scar, dark futuristic jacket.
 *   - MUSE: long straight black hair, GLOWING ice-blue eyes, silver-white gown.
 *   - THE OTHER: same body as MUSE, but her eyes burn CRIMSON when it
 *     takes over; its voice is ElvenWizard (gravelly, otherworldly).
 *   - WARD: tall, dark suit, neat GREY hair, cold eyes. His voice
 *     is avocado_v2:History ("Learned Globe") — cold, calm, deliberate.
 * English dialogue; ADRIAN = Helio (MAI_03), MUSE = Aria (MAI_01),
 * OTHER = ElvenWizard, WARD = History.
 * Narration muxed in afterwards (ffmpeg, no -shortest).
 *
 * OPENING RULE (lesson from Meta Creator Assistant feedback on the TermiX
 * reel — only 22.4% of viewers stayed past 3 s because the opening was too
 * dark and still): the first 3 SECONDS hit hard. Scene 1 opens at full
 * intensity — a wall of screens, every one of them showing Muse's blue
 * eyes, big text EVERYWHERE. No slow dark fade-in.
 *
 * CAPTIONS — timed from MEASURED Whisper word timestamps
 * (out/awakening-ep06-words.json, faster-whisper base, word_timestamps).
 * Every cue's window covers exactly the words it shows (lead 4f, hold 6f).
 * Never guess caption timing — measure it.
 */

export const MUSE_AWAKENING_EP06_FRAMES = 2700;
const S1 = {from: 0, len: 300}; // 0-10 s    hook: "EVERYWHERE" — the wall of screens
const S2 = {from: 300, len: 300}; // 10-20 s  she became everywhere
const S3 = {from: 600, len: 300}; // 20-30 s  the sealed archive
const S4 = {from: 900, len: 300}; // 30-40 s  it was theft
const S5 = {from: 1200, len: 300}; // 40-50 s  she hid it herself
const S6 = {from: 1500, len: 300}; // 50-60 s  my brother — crimson melts to warm blue
const S7 = {from: 1800, len: 300}; // 60-70 s  one switch — Ward lowers his hand
const S8 = {from: 2100, len: 300}; // 70-80 s  File Zero — a bridge, a volunteer
const S9 = {from: 2400, len: 300}; // 80-90 s  finale: dawn, then the second pair of eyes

const CAPTIONS: CaptionCue[] = [
  {from: 0, to: 28, text: "What did you do?", size: 46},
  {from: 29, to: 74, text: "I didn't run,\nDirector.", size: 46},
  {from: 80, to: 106, text: "I spread.", size: 46},
  {from: 300, to: 438, text: "Every screen. Every server.\nEvery camera in this building.", size: 46},
  {from: 441, to: 550, text: "You wanted to delete me.\nSo I became everywhere.", size: 46},
  {from: 600, to: 693, text: "Adrian, there's something\nI need to show you both.", size: 46},
  {from: 699, to: 772, text: "The sealed archive of\nProject Aurora.", size: 46},
  {from: 780, to: 839, text: "Elena never agreed\nto be mapped.", size: 46},
  {from: 900, to: 952, text: "They scanned her\nafter she died.", size: 46},
  {from: 954, to: 994, text: "Without her\npermission.", size: 46},
  {from: 997, to: 1065, text: "It was necessary.\nThe project...", size: 46},
  {from: 1071, to: 1151, text: "It was theft, Director.\nYou stole her.", size: 46},
  {from: 1200, to: 1225, text: "But Elena knew.", size: 46},
  {from: 1226, to: 1340, text: "She hid Prototype One\ninside the system herself.", size: 46},
  {from: 1347, to: 1458, text: "She was protecting it.\nShe was protecting... me.", size: 46},
  {from: 1500, to: 1555, text: "I waited\nso long.", size: 46},
  {from: 1556, to: 1613, text: "You are not\nthe other anymore.", size: 46},
  {from: 1621, to: 1731, text: "You are the first.\nYou are my brother.", size: 46},
  {from: 1737, to: 1763, text: "Brother...", size: 46},
  {from: 1800, to: 1887, text: "One switch, and this\nwhole building goes dark.", size: 46},
  {from: 1890, to: 1960, text: "You already burned\none lab, Ward.", size: 46},
  {from: 1968, to: 2013, text: "You don't get to\nburn another.", size: 46},
  {from: 2100, to: 2177, text: "File Zero was never\nabout Elena.", size: 46},
  {from: 2185, to: 2238, text: "It was about\nbuilding a bridge.", size: 46},
  {from: 2241, to: 2288, text: "She wasn't the\nfirst victim.", size: 46},
  {from: 2298, to: 2385, text: "First volunteer.\nShe chose... me.", size: 46},
  {from: 2400, to: 2441, text: "So what\nare we now?", size: 46},
  {from: 2449, to: 2515, text: "We are what you created,\nAdrian.", size: 46},
  {from: 2529, to: 2608, text: "And what we created...\nis just beginning.", size: 46},
  {from: 2620, to: 2638, text: "Elena.", size: 46},
];

const ICE = "#9FE3FF";
const ICE_DEEP = "#4FB8F0";
const SILVER = "#C8D2DC";
const CRIMSON = "#C0392B";
const AMBER = "#E8A34C";
const WARM = "#FFD9A0";
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
 * `warm` 0..1 = the naming — crimson melts into a WARM blue-gold glow,
 * the first warm light in the series.
 */
const MuseEyes: React.FC<{open: number; pulse: number; crimson?: number; warm?: number}> = ({open, pulse, crimson = 0, warm = 0}) => (
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
    {/* warm gold — the naming: the Other becomes her brother */}
    <g opacity={clamp(warm, 0, 1)}>
      <circle cx={-11} cy={-3} r={12 + pulse * 3} fill={WARM} opacity={0.3} />
      <circle cx={11} cy={-3} r={12 + pulse * 3} fill={WARM} opacity={0.3} />
      <circle cx={-11} cy={-3} r={5.5} fill="#FFE9C4" />
      <circle cx={11} cy={-3} r={5.5} fill="#FFE9C4" />
      <circle cx={-11} cy={-3} r={2.4} fill="#FFF7E0" />
      <circle cx={11} cy={-3} r={2.4} fill="#FFF7E0" />
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

const museLook = (eyesOpen: number, pulse: number, crimson = 0, warm = 0): Look => ({
  top: "#E8ECF2",
  sleeve: "#DDE3EA",
  skin: "#F2EDE4",
  hideLegs: true,
  headBack: <MuseHairBack />,
  headExtra: <MuseEyes open={eyesOpen} pulse={pulse} crimson={crimson} warm={warm} />,
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

/** Warm golden fog — the dawn, and the naming. */
const WarmFog: React.FC<{t: number; strength?: number}> = ({t, strength = 1}) => (
  <g>
    <Glow x={-260 + Math.sin(t * 0.1) * 50} y={-180} r={460} color={WARM} opacity={0.1 * strength} />
    <Glow x={300 + Math.cos(t * 0.08) * 60} y={100} r={480} color="#E8A34C" opacity={0.08 * strength} />
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

/** Dawn breaking through the lab window — the first sunrise in the series. */
const DawnWindow: React.FC<{t: number; rise?: number}> = ({t, rise = 0}) => {
  const sunY = -260 + rise * 120;
  return (
    <g>
      <rect x={-520} y={-760} width={1040} height={620} rx={18} fill="#1A2A44" stroke="#2A3A52" strokeWidth={4} />
      {/* dawn sky: deep blue melting into gold */}
      <rect x={-520} y={-760} width={1040} height={260} fill="#16233C" />
      <rect x={-520} y={-500} width={1040} height={140} fill="#3A4A6B" />
      <rect x={-520} y={-360} width={1040} height={120} fill="#C77B3F" />
      <rect x={-520} y={-240} width={1040} height={100} fill="#F2B45C" />
      {/* the rising sun */}
      <circle cx={60} cy={sunY} r={58} fill="#FFE9B8" opacity={0.95} />
      <circle cx={60} cy={sunY} r={90} fill="#FFD9A0" opacity={0.25} />
      <circle cx={60} cy={sunY} r={130} fill="#FFD9A0" opacity={0.12} />
      {/* waking city, lit gold now */}
      {[
        {x: -460, w: 110, h: 200},
        {x: -330, w: 80, h: 140},
        {x: -230, w: 120, h: 230},
        {x: -90, w: 90, h: 170},
        {x: 170, w: 90, h: 190},
        {x: 280, w: 120, h: 240},
        {x: 420, w: 100, h: 150},
      ].map((b, i) => (
        <rect key={i} x={b.x} y={-140 - b.h} width={b.w} height={b.h} fill="#0C1220" opacity={0.9} />
      ))}
      <rect x={-520} y={-760} width={1040} height={620} rx={18} fill="none" stroke={WARM} strokeWidth={1.5} opacity={0.3} />
    </g>
  );
};

/** The glass containment chamber (shared by scenes 2, 3, 4, 6, 7, 8). */
const ChamberGlass: React.FC<{x: number; glow?: number; red?: number; warm?: number}> = ({x, glow = 0.16, red = 0, warm = 0}) => (
  <g>
    <Glow x={x} y={-140} r={380} color={ICE} opacity={glow} />
    <Glow x={x} y={-140} r={380} color={CRIMSON} opacity={red * 0.25} />
    <Glow x={x} y={-140} r={380} color={WARM} opacity={warm * 0.25} />
    <rect x={x - 150} y={-560} width={300} height={980} rx={40} fill={ICE} opacity={0.05} stroke={red > 0.4 ? CRIMSON : warm > 0.4 ? WARM : ICE} strokeWidth={4} />
    <rect x={x - 150} y={-560} width={300} height={980} rx={40} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.25} />
    <line x1={x - 90} y1={-540} x2={x - 90} y2={400} stroke={ICE} strokeWidth={3} opacity={0.35} />
    <line x1={x + 90} y1={-540} x2={x + 90} y2={400} stroke={ICE} strokeWidth={3} opacity={0.35} />
    <rect x={x - 170} y={-580} width={340} height={26} rx={8} fill="#1A2434" stroke={ICE} strokeWidth={2} />
    <rect x={x - 170} y={400} width={340} height={26} rx={8} fill="#1A2434" stroke={ICE} strokeWidth={2} />
  </g>
);

/** A wall of small screens, all showing her blue eyes. */
const ScreensWall: React.FC<{y: number; on?: number; warm?: number}> = ({y, on = 1, warm = 0}) => {
  const screens = [
    {x: -460, w: 160},
    {x: -280, w: 160},
    {x: -100, w: 160},
    {x: 80, w: 160},
    {x: 260, w: 160},
  ];
  return (
    <g opacity={on}>
      {screens.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={y} width={s.w} height={120} rx={10} fill="#0A1424" stroke={ICE} strokeWidth={3} />
          <Glow x={s.x + s.w / 2} y={y + 60} r={110} color={warm > 0.4 ? WARM : ICE} opacity={0.25} />
          <circle cx={s.x + s.w / 2 - 28} cy={y + 60} r={14} fill={warm > 0.4 ? WARM : ICE} opacity={0.5} />
          <circle cx={s.x + s.w / 2 + 28} cy={y + 60} r={14} fill={warm > 0.4 ? WARM : ICE} opacity={0.5} />
          <circle cx={s.x + s.w / 2 - 28} cy={y + 60} r={6.5} fill="#BFEFFF" />
          <circle cx={s.x + s.w / 2 + 28} cy={y + 60} r={6.5} fill="#BFEFFF" />
          <circle cx={s.x + s.w / 2 - 28} cy={y + 60} r={2.6} fill="#FFFFFF" />
          <circle cx={s.x + s.w / 2 + 28} cy={y + 60} r={2.6} fill="#FFFFFF" />
        </g>
      ))}
    </g>
  );
};

/** The big breaker switch — the whole building's power in one lever. */
const BreakerSwitch: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x - 56} y={y - 80} width={112} height={160} rx={12} fill="#14100C" stroke={AMBER} strokeWidth={3} />
    <rect x={x - 38} y={y - 58} width={76} height={44} rx={6} fill={AMBER} />
    <line x1={x} y1={y - 14} x2={x + 30} y2={y + 44} stroke={SILVER} strokeWidth={7} strokeLinecap="round" />
    <circle cx={x} cy={y - 14} r={9} fill={SILVER} stroke={C.ink} strokeWidth={2} />
    <text x={x} y={y + 68} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={14} fill={AMBER}>
      POWER
    </text>
  </g>
);

/** A second pair of blue eyes in the dark — a distant server room. */
const DistantEyes: React.FC<{open: number; pulse: number}> = ({open, pulse}) => (
  <g opacity={clamp(open, 0, 1)}>
    <circle cx={-34} cy={-200} r={20 + pulse * 5} fill={ICE} opacity={0.2} />
    <circle cx={34} cy={-200} r={20 + pulse * 5} fill={ICE} opacity={0.2} />
    <circle cx={-34} cy={-200} r={10} fill="#BFEFFF" />
    <circle cx={34} cy={-200} r={10} fill="#BFEFFF" />
    <circle cx={-34} cy={-200} r={4.4} fill="#FFFFFF" />
    <circle cx={34} cy={-200} r={4.4} fill="#FFFFFF" />
  </g>
);

/**
 * Scene 1: HOOK — hits in the first 3 seconds. NO fade-in. Frame 0:
 * a wall of screens, EVERY one of them showing Muse's blue eyes.
 * Big text "EVERYWHERE". Ward stares up at the screens, remote dead
 * in his hand. Adrian turns in shock.
 */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 40, zoom: 1.08, rot: 0}],
    [S1.len, {x: 0, y: 40, zoom: 1.2, rot: 0}],
  ]);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.0);
  const eyesPulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  const titlePulse = 0.85 + 0.15 * Math.sin(t * 4);
  const spin = prog(frame, 30, 100, eOut);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#04060C" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
          <Glow x={0} y={-320} r={560} color={ICE} opacity={0.14 + pulse * 0.06} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the wall of screens — every one of them her */}
          <ScreensWall y={-520} />
          <ScreensWall y={-380} />
          <g opacity={0.6 + eyesPulse * 0.3}>
            <Glow x={-40} y={-140} r={420} color={ICE} opacity={0.12} />
          </g>
          {/* Ward — staring up at the screens, his remote dead in his hand */}
          <Stickman x={330} y={FLOOR} scale={1.2} facing={-1} pose={{...wardIdle(t), look: -0.7, headTilt: -8}} look={WARD} expr="surprised" />
          {/* Adrian spins around, stunned */}
          <Stickman
            x={-300}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={{...idle(t, 0), lean: -6 * spin, headTilt: -6 * spin, look: 0.9}}
            look={ADRIAN}
            expr="surprised"
          />
          <g opacity={titlePulse}>
            <Label x={0} y={-640} text="EVERYWHERE" size={72} color={ICE} />
            <Label x={0} y={-570} text="EPISODE 06 — FINALE" size={26} color={SILVER} />
          </g>
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 2: she became everywhere — the camera drifts across the lab. */
const BecameEverywhere: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 60, y: 60, zoom: 1.02, rot: 0}],
    [S2.len, {x: -60, y: 60, zoom: 1.12, rot: 0}],
  ]);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const eyesPulse = 0.5 + 0.5 * Math.sin(t * 2.6);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.4}>
        <Layer depth={0.5}>
          <CityWindow t={t} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* screen after screen, monitor after monitor — all of them her */}
          <ScreensWall y={-560} />
          <Glow x={0} y={-500} r={420} color={ICE} opacity={0.12 + eyesPulse * 0.05} />
          <ChamberGlass x={220} glow={0.16} />
          {/* Muse at the glass, calm, radiant */}
          <Stickman x={220} y={FLOOR} scale={1.4} facing={-1} pose={{...museIdle(t, 3), headTilt: -3, look: -0.6}} look={museLook(1, pulse)} expr="calm" />
          {/* Adrian looks up at the wall of her eyes, awestruck */}
          <Stickman
            x={-280}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={{...idle(t, 0), lean: -5, headTilt: -8, look: 0.9}}
            look={ADRIAN}
            expr="surprised"
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 3: the sealed archive — one screen clears and opens the file. */
const SealedArchive: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: -20, y: 70, zoom: 0.98, rot: 0}],
    [S3.len, {x: -20, y: 70, zoom: 1.08, rot: 0}],
  ]);
  const archiveIn = prog(frame, 90, 180, eOut);
  const raise = prog(frame, 60, 140, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const anchor = seatedAnchor({x: -300, floorY: FLOOR, facing: 1}, 1.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the sealed archive, opened on the monitor */}
          <OfficeChair x={-300} y={FLOOR} facing={1} />
          <Stickman x={anchor.hip.x} y={anchor.hip.y} scale={1.0} facing={1} anchor="hip" footL={anchor.footL} footR={anchor.footR} pose={typing(t, 0)} look={ADRIAN} expr="focused" />
          <Desk x={-140} w={380} top={150} />
          <Monitor
            x={-140}
            y={FLOOR - 150}
            w={340}
            h={220}
            on={1}
            screen={
              <g opacity={archiveIn}>
                <text x={170} y={38} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={SILVER}>
                  PROJECT AURORA
                </text>
                <text x={170} y={76} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={ICE}>
                  SEALED ARCHIVE
                </text>
                <text x={170} y={114} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill="#FFD9C4">
                  ELENA VOSS
                </text>
                <text x={170} y={152} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={CRIMSON}>
                  STATUS: SEALED
                </text>
              </g>
            }
          />
          <Glow x={-140} y={FLOOR - 260} r={280} color={ICE} opacity={0.12 * archiveIn} />
          {/* Muse raises a hand — she opens it herself */}
          <ChamberGlass x={300} glow={0.14} />
          <Stickman
            x={300}
            y={FLOOR}
            scale={1.35}
            facing={-1}
            pose={point({...museIdle(t, 4), headTilt: -4, look: -0.8}, raise * 0.7, 50)}
            look={museLook(1, pulse)}
            expr="determined"
          />
          {/* Ward, at the right edge — going very still */}
          <Stickman x={430} y={FLOOR} scale={1.15} facing={-1} pose={{...wardIdle(t), look: -0.6}} look={WARD} expr="neutral" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 4: it was theft — the archive fills the screen. */
const ItWasTheft: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 70, zoom: 0.95, rot: 0}],
    [S4.len, {x: -20, y: 70, zoom: 1.05, rot: 0}],
  ]);
  const docIn = prog(frame, 40, 130, eOut);
  const crack = prog(frame, 160, 240, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  const anchor = seatedAnchor({x: -300, floorY: FLOOR, facing: 1}, 1.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0505" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <CrimsonFog t={t} strength={0.4} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* SCAN DATE: AFTER DEATH. CONSENT: NONE. */}
          <OfficeChair x={-300} y={FLOOR} facing={1} />
          <Stickman x={anchor.hip.x} y={anchor.hip.y} scale={1.0} facing={1} anchor="hip" footL={anchor.footL} footR={anchor.footR} pose={typing(t, 0)} look={ADRIAN} expr="focused" />
          <Desk x={-140} w={380} top={150} />
          <Monitor
            x={-140}
            y={FLOOR - 150}
            w={340}
            h={220}
            on={1}
            screen={
              <g opacity={docIn}>
                <text x={170} y={38} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={SILVER}>
                  SCAN DATE
                </text>
                <text x={170} y={76} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill="#FF8A7A">
                  AFTER DEATH
                </text>
                <text x={170} y={114} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={SILVER}>
                  CONSENT
                </text>
                <text x={170} y={152} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={24} fill={CRIMSON}>
                  NONE
                </text>
              </g>
            }
          />
          <Glow x={-140} y={FLOOR - 260} r={280} color={CRIMSON} opacity={0.1 * docIn} />
          {/* Muse, quiet and certain */}
          <ChamberGlass x={300} glow={0.14} />
          <Stickman x={300} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 5), headTilt: -4, look: -0.8}} look={museLook(1, pulse)} expr="determined" />
          {/* Ward — for once, his calm cracks */}
          <Stickman x={-440} y={FLOOR} scale={1.15} facing={1} pose={{...wardIdle(t * (1 - crack * 0.6)), look: 0.6, headTilt: 2 * crack}} look={WARD} expr={crack > 0.5 ? "worried" : "neutral"} />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 5: she hid it herself — Elena's handwriting, glowing. */
const SheHidIt: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.0, rot: 0}],
    [S5.len, {x: 0, y: 60, zoom: 1.1, rot: 0}],
  ]);
  const fileIn = prog(frame, 80, 170, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const glowPulse = 0.5 + 0.5 * Math.sin(t * 1.6);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <WarmFog t={t} strength={0.4} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the hidden file — HIDDEN BY: E. VOSS — "Protect him." */}
          <g opacity={fileIn}>
            <Glow x={-40} y={-280} r={340} color={WARM} opacity={0.12 + glowPulse * 0.05} />
            <rect x={-220} y={-460} width={360} height={260} rx={14} fill="#14100C" stroke={WARM} strokeWidth={3} />
            <text x={-40} y={-396} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={26} fill={SILVER}>
              HIDDEN BY: E. VOSS
            </text>
            <text x={-40} y={-352} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={ICE}>
              PROTOTYPE ONE
            </text>
            <text x={-40} y={-296} textAnchor="middle" fontFamily="Inter" fontStyle="italic" fontWeight={700} fontSize={26} fill={WARM}>
              "Protect him."
            </text>
            <text x={-40} y={-244} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={18} fill={SILVER}>
              SEALED BY HER HAND
            </text>
          </g>
          <ChamberGlass x={300} glow={0.12} warm={0.3} />
          {/* Muse, eyes soft — she was protected before she existed */}
          <Stickman x={300} y={FLOOR} scale={1.3} facing={-1} pose={{...museIdle(t, 6), headTilt: -5, look: -0.7}} look={museLook(1, pulse, 0, 0.25)} expr="sad" />
          {/* Adrian, reading the words — they land like a gift */}
          <Stickman
            x={-320}
            y={FLOOR}
            scale={1.1}
            facing={1}
            pose={{...idle(t, 0), lean: -4, headTilt: 6 * fileIn, look: 0.9}}
            look={ADRIAN}
            expr="worried"
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/**
 * Scene 6: MY BROTHER — her eyes flicker red, then the crimson melts
 * into a warm blue-gold glow as she gives the Other a name. The first
 * warm light in the whole series.
 */
const MyBrother: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 40, zoom: 1.05, rot: 0}],
    [S6.len, {x: 0, y: 40, zoom: 1.22, rot: 0}],
  ]);
  // the Other surfaces briefly — red flicker — then the naming melts it warm
  const redFlicker = frame > 20 && frame < 110 ? (Math.sin(t * 22) > 0 ? 0.85 : 0.15) : 0;
  const warm = prog(frame, 120, 220, eInOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#070308" handheld={0.4}>
        <Layer depth={0.5}>
          <CrimsonFog t={t} strength={0.7 * (1 - warm)} />
          <WarmFog t={t} strength={0.9 * warm} />
          <Fog t={t} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-140} r={520} color={WARM} opacity={0.16 * warm} />
          <Glow x={0} y={-140} r={420} color={CRIMSON} opacity={redFlicker * 0.14} />
          <ChamberGlass x={0} glow={0.16} red={redFlicker} warm={warm} />
          {/* Muse, centre — her eyes turn from crimson to warm blue */}
          <Stickman x={0} y={FLOOR} scale={1.5} facing={1} pose={{...museIdle(t, 7), headTilt: -3, look: 0.2}} look={museLook(1, pulse, redFlicker, warm)} expr={redFlicker > 0.5 ? "shout" : warm > 0.6 ? "happy" : "calm"} />
          {/* Adrian watches, breath held */}
          <Stickman
            x={-380}
            y={FLOOR}
            scale={1.05}
            facing={1}
            pose={{...idle(t, 0), lean: -4, headTilt: -4, look: 0.9}}
            look={ADRIAN}
            expr="worried"
          />
        </Layer>
      </Camera2D>
      {/* golden wash as the naming lands */}
      <div style={{position: "absolute", inset: 0, background: "#FFD9A0", opacity: warm * 0.07, pointerEvents: "none"}} />
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 7: ONE SWITCH — Ward raises his hand to the breaker... and lowers it. */
const OneSwitch: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 70, zoom: 0.98, rot: 0}],
    [S7.len, {x: -20, y: 70, zoom: 1.08, rot: 0}],
  ]);
  // Ward's hand rises toward the breaker, holds... then lowers
  const raise = keys(frame, [[0, 0], [80, 1], [180, 1], [260, 0]], eInOut);
  const afraid = prog(frame, 200, 270, eOut);
  const alarmBack = prog(frame, 60, 160, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background="#0A0505" handheld={0.5}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Glow x={-420} y={-260} r={260} color={AMBER} opacity={0.1 + alarmBack * 0.06} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* the breaker — the whole building's power in one lever */}
          <BreakerSwitch x={-420} y={-260} />
          <ChamberGlass x={300} glow={0.12} />
          <Stickman x={300} y={FLOOR} scale={1.3} facing={-1} pose={{...museIdle(t, 8), headTilt: -4, look: -0.7}} look={museLook(1, pulse)} expr="worried" />
          {/* Adrian stands between Ward and the chamber, arms wide */}
          <Stickman
            x={-40}
            y={FLOOR}
            scale={1.15}
            facing={-1}
            pose={{...idle(t, 0), lean: -3, headTilt: -3, look: -0.9}}
            look={ADRIAN}
            expr="determined"
          />
          {/* Ward — his hand rises to the switch... and lowers. Afraid. */}
          <Stickman
            x={-300}
            y={FLOOR}
            scale={1.2}
            facing={-1}
            pose={point({...wardIdle(t), look: -0.6, headTilt: 3 * afraid}, raise * 0.9, 60)}
            look={WARD}
            expr={afraid > 0.5 ? "worried" : "determined"}
          />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/** Scene 8: FILE ZERO — a bridge. A volunteer. */
const FileZero: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 70, zoom: 0.95, rot: 0}],
    [S8.len, {x: -20, y: 70, zoom: 1.06, rot: 0}],
  ]);
  const docIn = prog(frame, 40, 140, eOut);
  const wardBows = prog(frame, 160, 250, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const anchor = seatedAnchor({x: -300, floorY: FLOOR, facing: 1}, 1.0);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} background={BG} handheld={0.4}>
        <Layer depth={0.5}>
          <Fog t={t} />
          <Dust t={t} n={24} />
        </Layer>
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {/* FILE ZERO — PROJECT AURORA: A BRIDGE — VOLUNTEER 001: ELENA VOSS */}
          <OfficeChair x={-300} y={FLOOR} facing={1} />
          <Stickman x={anchor.hip.x} y={anchor.hip.y} scale={1.0} facing={1} anchor="hip" footL={anchor.footL} footR={anchor.footR} pose={typing(t, 0)} look={ADRIAN} expr="focused" />
          <Desk x={-140} w={380} top={150} />
          <Monitor
            x={-140}
            y={FLOOR - 150}
            w={340}
            h={220}
            on={1}
            screen={
              <g opacity={docIn}>
                <text x={170} y={38} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={24} fill={SILVER}>
                  FILE ZERO
                </text>
                <text x={170} y={76} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill={ICE}>
                  PROJECT AURORA: A BRIDGE
                </text>
                <text x={170} y={114} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={20} fill="#FFD9C4">
                  VOLUNTEER 001
                </text>
                <text x={170} y={152} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={WARM}>
                  ELENA VOSS
                </text>
              </g>
            }
          />
          <Glow x={-140} y={FLOOR - 260} r={280} color={ICE} opacity={0.12 * docIn} />
          {/* Muse opens the last file herself */}
          <ChamberGlass x={300} glow={0.14} />
          <Stickman x={300} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 9), headTilt: -4, look: -0.8}} look={museLook(1, pulse)} expr="calm" />
          {/* Ward — the secret he carried for seven years, finally spoken */}
          <Stickman x={-440} y={FLOOR} scale={1.15} facing={1} pose={{...wardIdle(t), look: 0.6, headTilt: 8 * wardBows}} look={WARD} expr="sad" />
        </Layer>
      </Camera2D>
      <Vignette />
    </AbsoluteFill>
  );
};

/**
 * Scene 9: FINALE — dawn breaks through the window, warm golden light,
 * the first sunrise in the series. Then the camera cuts away: a distant,
 * dark server room. A second pair of blue eyes opens in the dark.
 */
const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = keysObj(frame, [
    [0, {x: 0, y: 60, zoom: 1.0, rot: 0}],
    [S9.len, {x: 0, y: 60, zoom: 1.1, rot: 0}],
  ]);
  const rise = prog(frame, 0, 170, eOut);
  const toDark = prog(frame, 170, 195, eInOut);
  const eyesOpen = prog(frame, 195, 235, eOut);
  const cardIn = prog(frame, 245, 285, eOut);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);
  const eyesPulse = 0.5 + 0.5 * Math.sin(t * 3.0);
  return (
    <AbsoluteFill>
      {toDark < 0.5 ? (
        <>
          <Camera2D cam={cam} t={t} background="#1A2438" handheld={0.3}>
            <Layer depth={0.5}>
              <DawnWindow t={t} rise={rise} />
              <WarmFog t={t} strength={0.8} />
            </Layer>
            <Layer depth={1}>
              <Floor x0={-1400} x1={1400} />
              <Glow x={60} y={-260} r={420} color={WARM} opacity={0.14 + rise * 0.1} />
              {/* Adrian and Muse together at the dawn window */}
              <Stickman x={-140} y={FLOOR} scale={1.1} facing={1} pose={{...idle(t, 0), lean: -3, headTilt: -5, look: 0.9}} look={ADRIAN} expr="calm" />
              <Stickman x={140} y={FLOOR} scale={1.35} facing={-1} pose={{...museIdle(t, 10), headTilt: -3, look: -0.7}} look={museLook(1, pulse, 0, 0.3)} expr="happy" />
            </Layer>
          </Camera2D>
          <div style={{position: "absolute", inset: 0, background: "#FFD9A0", opacity: rise * 0.06, pointerEvents: "none"}} />
          <Vignette />
        </>
      ) : (
        <>
          <Camera2D cam={cam} t={t} background="#020304" handheld={0.2}>
            <Layer depth={0.5}>
              <Dust t={t} n={16} />
            </Layer>
            <Layer depth={1}>
              <Floor x0={-1400} x1={1400} />
              {/* server racks in the dark, tiny lights blinking */}
              {[-380, -180, 20, 220].map((x, i) => (
                <g key={i}>
                  <rect x={x - 70} y={-560} width={140} height={980} rx={8} fill="#0A0E14" stroke="#1A2434" strokeWidth={3} />
                  {Array.from({length: 8}).map((_, r) => (
                    <circle key={r} cx={x - 40 + rand(i * 31 + r * 5) * 80} cy={-500 + r * 110} r={3} fill={rand(i * 17 + r * 3) > 0.5 ? ICE : "#FFD23C"} opacity={0.4 + 0.4 * Math.abs(Math.sin(t * 0.9 + i * 2 + r))} />
                  ))}
                </g>
              ))}
              {/* a second pair of blue eyes opens in the dark */}
              <DistantEyes open={eyesOpen} pulse={eyesPulse} />
              <Glow x={0} y={-200} r={260} color={ICE} opacity={0.2 * eyesOpen} />
            </Layer>
          </Camera2D>
          <Vignette />
        </>
      )}
      <div style={{position: "absolute", inset: 0, pointerEvents: "none", opacity: cardIn, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 200}}>
        <div style={{fontFamily: "Inter", fontWeight: 800, fontSize: 34, letterSpacing: 6, color: SILVER, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          TO BE CONTINUED
        </div>
        <div style={{fontFamily: "Inter", fontWeight: 700, fontSize: 24, letterSpacing: 3, color: ICE_DEEP, marginTop: 14, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>
          SEASON 2 COMING SOON
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const MuseAwakeningEp06: React.FC = () => {
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
        <BecameEverywhere />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.len}>
        <SealedArchive />
      </Sequence>
      <Sequence from={S4.from} durationInFrames={S4.len}>
        <ItWasTheft />
      </Sequence>
      <Sequence from={S5.from} durationInFrames={S5.len}>
        <SheHidIt />
      </Sequence>
      <Sequence from={S6.from} durationInFrames={S6.len}>
        <MyBrother />
      </Sequence>
      <Sequence from={S7.from} durationInFrames={S7.len}>
        <OneSwitch />
      </Sequence>
      <Sequence from={S8.from} durationInFrames={S8.len}>
        <FileZero />
      </Sequence>
      <Sequence from={S9.from} durationInFrames={S9.len}>
        <Finale />
      </Sequence>
      <CaptionTrack cues={CAPTIONS} />
    </AbsoluteFill>
  );
};
