// Animated scenes, one per beat, named in reel.json as "scene": "name".
// Draw each one as an SVG on a 1080x1920 canvas and keep the subject between
// y 700 and 1350, clear of the card above and the caption below.
// A scene gets its beat, so it can show beat.label or beat.labels.
// Leave this empty to use plain backgrounds or the user's own clips.

import type {Beat} from './Reel';

export const scenes: Record<string, React.FC<{beat: Beat}>> = {};
