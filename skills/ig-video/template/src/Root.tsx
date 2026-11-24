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
    durationInFrames={1}
    defaultProps={data}
    // The video is as long as the last beat, so editing reel.json is enough.
    // --props=other.json renders a second version, e.g. another language.
    calculateMetadata={({props}) => ({
      fps: props.fps,
      durationInFrames: Math.ceil(
        Math.max(...props.beats.map((b) => b.start + b.dur)) * props.fps,
      ),
    })}
  />
);
