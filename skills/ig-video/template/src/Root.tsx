import {Composition} from 'remotion';
import {Reel, type ReelData} from './Reel';
import reel from '../reel.json';

const data = reel as ReelData;

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={1080}
    height={1920}
    fps={data.fps}
    // The video is as long as the last beat, so editing reel.json is enough.
    durationInFrames={Math.ceil(
      Math.max(...data.beats.map((b) => b.start + b.dur)) * data.fps,
    )}
    defaultProps={data}
  />
);
