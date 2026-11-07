import {Composition} from 'remotion';
import {Cards, TOTAL} from './Cards';

export const Root: React.FC = () => (
  <>
    <Composition id="CardsZH" component={Cards} width={1080} height={1920} fps={30} durationInFrames={TOTAL} defaultProps={{lang: 'zh' as const}} />
    <Composition id="CardsEN" component={Cards} width={1080} height={1920} fps={30} durationInFrames={TOTAL} defaultProps={{lang: 'en' as const}} />
  </>
);
