import {Composition} from 'remotion';
import {Cards, TOTAL} from './Cards';
import {Spec, SPEC_FRAMES} from './Spec';
import {Sleep, SLEEP_FRAMES} from './Sleep';
import {Procrast, PRO_FRAMES} from './Procrast';
import {ProcrastEN, PRO_EN_FRAMES} from './ProcrastEN';
import {Habit, HABIT_FRAMES} from './Habit';
import {HabitEN, HABIT_EN_FRAMES} from './HabitEN';
import {HabitSame, HABIT_SAME_FRAMES} from './HabitSame';
import {HabitSameEN, HABIT_SAME_EN_FRAMES} from './HabitSameEN';
import {Huashu, HUASHU_FRAMES} from './Huashu';
import {HuashuEN, HUASHU_EN_FRAMES} from './HuashuEN';
import {Elegant, ELEGANT_FRAMES} from './Elegant';
import {ElegantBrand, BRAND_FRAMES} from './ElegantBrand';
import {Vibe, VIBE_FRAMES} from './Vibe';
import {Spot, SPOT_FRAMES} from './Spot';
import {SpotEN, SPOT_EN_FRAMES} from './SpotEN';
import {Story, STORY_FRAMES} from './Story';
import {StoryZH, STORY_ZH_FRAMES} from './StoryZH';
import {Fight, FIGHT_EN_FRAMES, FIGHT_ZH_FRAMES} from './Fight';
import {Fight2, FIGHT2_EN_FRAMES, FIGHT2_ZH_FRAMES} from './Fight2';
import {Phantom, PHANTOM_EN_FRAMES, PHANTOM_ZH_FRAMES} from './Phantom';
import {VibeEN, VIBE_EN_FRAMES} from './VibeEN';

export const Root: React.FC = () => (
  <>
    <Composition id="CardsZH" component={Cards} width={1080} height={1920} fps={30} durationInFrames={TOTAL} defaultProps={{lang: 'zh' as const}} />
    <Composition id="CardsEN" component={Cards} width={1080} height={1920} fps={30} durationInFrames={TOTAL} defaultProps={{lang: 'en' as const}} />
    <Composition id="SpecZH" component={Spec} width={1080} height={1920} fps={30} durationInFrames={SPEC_FRAMES} />
    <Composition id="SleepZH" component={Sleep} width={1080} height={1920} fps={30} durationInFrames={SLEEP_FRAMES} />
    <Composition id="ProcrastZH" component={Procrast} width={1080} height={1920} fps={30} durationInFrames={PRO_FRAMES} />
    <Composition id="ProcrastEN" component={ProcrastEN} width={1080} height={1920} fps={30} durationInFrames={PRO_EN_FRAMES} />
    <Composition id="HabitZH" component={Habit} width={1080} height={1920} fps={30} durationInFrames={HABIT_FRAMES} />
    <Composition id="HabitEN" component={HabitEN} width={1080} height={1920} fps={30} durationInFrames={HABIT_EN_FRAMES} />
    <Composition id="HabitSameZH" component={HabitSame} width={1080} height={1920} fps={30} durationInFrames={HABIT_SAME_FRAMES} />
    <Composition id="HuashuZH" component={Huashu} width={1080} height={1920} fps={30} durationInFrames={HUASHU_FRAMES} />
    <Composition id="HuashuEN" component={HuashuEN} width={1080} height={1920} fps={30} durationInFrames={HUASHU_EN_FRAMES} />
    <Composition id="ElegantZH" component={Elegant} width={1080} height={1920} fps={30} durationInFrames={ELEGANT_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="ElegantEN" component={Elegant} width={1080} height={1920} fps={30} durationInFrames={ELEGANT_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="BrandZH" component={ElegantBrand} width={1080} height={1920} fps={30} durationInFrames={BRAND_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="BrandEN" component={ElegantBrand} width={1080} height={1920} fps={30} durationInFrames={BRAND_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="HabitSameEN" component={HabitSameEN} width={1080} height={1920} fps={30} durationInFrames={HABIT_SAME_EN_FRAMES} />
    <Composition id="Vibe" component={Vibe} width={1920} height={1080} fps={30} durationInFrames={VIBE_FRAMES} />
    <Composition id="VibeEN" component={VibeEN} width={1920} height={1080} fps={30} durationInFrames={VIBE_EN_FRAMES} />
    <Composition id="SpotZH" component={Spot} width={1080} height={1920} fps={30} durationInFrames={SPOT_FRAMES} />
    <Composition id="SpotEN" component={SpotEN} width={1080} height={1920} fps={30} durationInFrames={SPOT_EN_FRAMES} />
    <Composition id="Story" component={Story} width={1080} height={1920} fps={30} durationInFrames={STORY_FRAMES} />
    <Composition id="StoryZH" component={StoryZH} width={1080} height={1920} fps={30} durationInFrames={STORY_ZH_FRAMES} />
    <Composition id="FightEN" component={Fight} width={1080} height={1920} fps={30} durationInFrames={FIGHT_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="FightZH" component={Fight} width={1080} height={1920} fps={30} durationInFrames={FIGHT_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="Fight2EN" component={Fight2} width={1080} height={1920} fps={30} durationInFrames={FIGHT2_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="Fight2ZH" component={Fight2} width={1080} height={1920} fps={30} durationInFrames={FIGHT2_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="PhantomEN" component={Phantom} width={1080} height={1920} fps={30} durationInFrames={PHANTOM_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="PhantomZH" component={Phantom} width={1080} height={1920} fps={30} durationInFrames={PHANTOM_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
  </>
);
