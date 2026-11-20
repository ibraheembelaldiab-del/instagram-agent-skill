import {Composition} from 'remotion';
import {Reel3D, type Reel3DData} from './Reel3D';
import reel from '../reel.json';

export const Root: React.FC = () => (
  <>
  <Composition
    id="Reel3D"
    component={Reel3D}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={1}
    defaultProps={reel as Reel3DData}
    calculateMetadata={({props}) => ({
      fps: props.fps,
      durationInFrames: Math.ceil(Math.max(...props.beats.map((b) => b.start + b.dur)) * props.fps),
    })}
  />
  </>
);
