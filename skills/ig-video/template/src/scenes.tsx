// Animated scenes, one per beat, named in reel.json as "scene": "name".
// Draw each one as an SVG on a 1080x1920 canvas and keep the subject between
// y 700 and 1350, clear of the card above and the caption below.
// Leave this empty to use plain backgrounds or the user's own clips.

export const scenes: Record<string, React.FC> = {};
