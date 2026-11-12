import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {C, FONT, W} from "../styles/palette";

/*
 * Basic timed captions. Each cue is a phrase with a start and an end frame (scene-local, 30 fps).
 *
 * Positions are the top edge of the caption block, in 1080 x 1920 frame pixels:
 *   top 420 | upper 620 | mid 860 | lower 1380 (default)
 * The default "lower" band sits in the lower third and stays clear of the bottom 300 px, where
 * phone apps draw their own controls. Pick a position by looking at a still with the caption on it.
 * Use `y` to place a caption at any height instead of a named position.
 */

export type CaptionCue = {
  from: number;   // first frame on screen
  to: number;     // first frame after the caption leaves
  text: string;   // one phrase; use "\n" for a second line (two lines at most)
  pos?: keyof typeof POS_Y;
  y?: number;
  size?: number;  // font size override (default 54); use smaller when a line would wrap
};

export const POS_Y = {top: 420, upper: 620, mid: 860, lower: 1380};

const RISE = 7;   // frames for the rise-in
const FADE = 6;   // frames for the fade-out

const CueView: React.FC<{text: string; top: number; dur: number; size?: number}> = ({text, top, dur, size}) => {
  const f = useCurrentFrame();
  const kIn = interpolate(f, [0, RISE], [0, 1], {extrapolateRight: "clamp"});
  const kOut = interpolate(f, [dur - FADE, dur], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const k = Math.min(kIn, kOut);
  return (
    <div
      style={{
        position: "absolute",
        left: 90,            // 90 px safe margin on each side
        width: W - 180,
        top,
        display: "flex",
        justifyContent: "center",
        opacity: k,
        transform: `translateY(${(1 - kIn) * 14}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: size ?? 54,
          lineHeight: 1.18,
          color: C.bone,
          textAlign: "center",
          whiteSpace: "pre-line",
          textShadow: "0 3px 12px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.95)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const CaptionTrack: React.FC<{cues: CaptionCue[]}> = ({cues}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={Math.max(1, c.to - c.from)}>
        <CueView text={c.text} top={c.y ?? POS_Y[c.pos ?? "lower"]} dur={Math.max(1, c.to - c.from)} size={c.size} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
