import React from "react";
import {Composition, staticFile} from "remotion";
import {Example01WalkingStickman, EXAMPLE01_FRAMES} from "./scenes/Example01WalkingStickman";
import {Example02OfficeScene, EXAMPLE02_FRAMES} from "./scenes/Example02OfficeScene";
import {Example03MiniDocumentary, EXAMPLE03_FRAMES} from "./scenes/Example03MiniDocumentary";
import {TermixStickman, TERMIX_FRAMES} from "./scenes/TermixStickman";
import {TermixStickman60, TERMIX60_FRAMES} from "./scenes/TermixStickman60";
import {AgeOfIntelligence, AOI_FRAMES} from "./scenes/AgeOfIntelligence";
import {MuseEp01, MUSE_EP01_FRAMES} from "./scenes/MuseEp01";
import {MuseEp01Epic, MUSE_EP01_EPIC_FRAMES} from "./scenes/MuseEp01Epic";
import {MuseEp01EpicV2, MUSE_EP01_EPIC_V2_FRAMES} from "./scenes/MuseEp01EpicV2";
import {MuseAwakeningEp01, MUSE_AWAKENING_EP01_FRAMES} from "./scenes/MuseAwakeningEp01";
import {MuseAwakeningEp02, MUSE_AWAKENING_EP02_FRAMES} from "./scenes/MuseAwakeningEp02";
import {MuseAwakeningEp03, MUSE_AWAKENING_EP03_FRAMES} from "./scenes/MuseAwakeningEp03";
import {MuseAwakeningEp04, MUSE_AWAKENING_EP04_FRAMES} from "./scenes/MuseAwakeningEp04";
import {MuseAwakeningEp05, MUSE_AWAKENING_EP05_FRAMES} from "./scenes/MuseAwakeningEp05";
import {MuseAwakeningEp06, MUSE_AWAKENING_EP06_FRAMES} from "./scenes/MuseAwakeningEp06";
import {FPS, H, W} from "./styles/palette";

// Local Inter @font-face (vendored in public/fonts/). Keeps every composition
// self-contained: no fetch to fonts.gstatic.com at render time.
const FONT_FACE = `
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 600; font-display: swap; src: url(${staticFile("fonts/Inter-600.woff2")}) format('woff2'); }
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 700; font-display: swap; src: url(${staticFile("fonts/Inter-700.woff2")}) format('woff2'); }
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 800; font-display: swap; src: url(${staticFile("fonts/Inter-800.woff2")}) format('woff2'); }
`;

// One composition per example. Render with: npx remotion render src/index.ts <Id> out/<name>.mp4
export const Root: React.FC = () => (
  <>
    <style>{FONT_FACE}</style>
    <Composition id="Example01-WalkingStickman" component={Example01WalkingStickman} durationInFrames={EXAMPLE01_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Example02-OfficeScene" component={Example02OfficeScene} durationInFrames={EXAMPLE02_FRAMES} fps={FPS} width={W} height={H} />
    <Composition
      id="Example03-MiniDocumentary"
      component={Example03MiniDocumentary}
      durationInFrames={EXAMPLE03_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: undefined}}
    />
    <Composition id="Termix-Stickman" component={TermixStickman} durationInFrames={TERMIX_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Termix-Stickman-60" component={TermixStickman60} durationInFrames={TERMIX60_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="AgeOfIntelligence" component={AgeOfIntelligence} durationInFrames={AOI_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Ep01" component={MuseEp01} durationInFrames={MUSE_EP01_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Ep01-Epic" component={MuseEp01Epic} durationInFrames={MUSE_EP01_EPIC_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Ep01-Epic-V2" component={MuseEp01EpicV2} durationInFrames={MUSE_EP01_EPIC_V2_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Awakening-Ep01" component={MuseAwakeningEp01} durationInFrames={MUSE_AWAKENING_EP01_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Awakening-Ep02" component={MuseAwakeningEp02} durationInFrames={MUSE_AWAKENING_EP02_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Awakening-Ep03" component={MuseAwakeningEp03} durationInFrames={MUSE_AWAKENING_EP03_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Awakening-Ep04" component={MuseAwakeningEp04} durationInFrames={MUSE_AWAKENING_EP04_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Awakening-Ep05" component={MuseAwakeningEp05} durationInFrames={MUSE_AWAKENING_EP05_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Muse-Awakening-Ep06" component={MuseAwakeningEp06} durationInFrames={MUSE_AWAKENING_EP06_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
