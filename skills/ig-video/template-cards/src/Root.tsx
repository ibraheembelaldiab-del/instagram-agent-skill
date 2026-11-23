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
import {Door, DOOR_EN_FRAMES, DOOR_ZH_FRAMES} from './Door';
import {Night, NIGHT_FRAMES} from './Night';
import {Talk, TALK_FRAMES} from './Talk';
import {TalkShort, TALKS_EN_FRAMES} from './TalkShort';
import {Drain, DRAIN_EN_FRAMES} from './Drain';
import {Decoy, DECOY_EN_FRAMES, DECOY_ZH_FRAMES} from './Decoy';
import {Praise, PRAISE_EN_FRAMES, PRAISE_ZH_FRAMES} from './Praise';
import {Kind, KIND_EN_FRAMES, KIND_ZH_FRAMES} from './Kind';
import {PraiseN, PRAISEN_EN_FRAMES, PRAISEN_ZH_FRAMES} from './PraiseN';
import {KindN, KINDN_EN_FRAMES, KINDN_ZH_FRAMES} from './KindN';
import {Song, SONG_EN_FRAMES, SONG_ZH_FRAMES} from './Song';
import {Ep1, EP1_EN_FRAMES, EP1_ZH_FRAMES} from './Ep1';
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
    <Composition id="DoorEN" component={Door} width={1080} height={1920} fps={30} durationInFrames={DOOR_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="DoorZH" component={Door} width={1080} height={1920} fps={30} durationInFrames={DOOR_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="Night" component={Night} width={1920} height={1080} fps={30} durationInFrames={NIGHT_FRAMES} />
    <Composition id="Talk" component={Talk} width={1920} height={1080} fps={30} durationInFrames={TALK_FRAMES} />
    <Composition id="TalkShortEN" component={TalkShort} width={1080} height={1920} fps={30} durationInFrames={TALKS_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="DrainEN" component={Drain} width={1080} height={1920} fps={30} durationInFrames={DRAIN_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="DecoyEN" component={Decoy} width={1080} height={1920} fps={30} durationInFrames={DECOY_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="DecoyZH" component={Decoy} width={1080} height={1920} fps={30} durationInFrames={DECOY_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="PraiseEN" component={Praise} width={1080} height={1920} fps={30} durationInFrames={PRAISE_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="PraiseZH" component={Praise} width={1080} height={1920} fps={30} durationInFrames={PRAISE_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="KindEN" component={Kind} width={1080} height={1920} fps={30} durationInFrames={KIND_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="KindZH" component={Kind} width={1080} height={1920} fps={30} durationInFrames={KIND_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="PraiseNEN" component={PraiseN} width={1080} height={1920} fps={30} durationInFrames={PRAISEN_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="PraiseNZH" component={PraiseN} width={1080} height={1920} fps={30} durationInFrames={PRAISEN_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="KindNEN" component={KindN} width={1080} height={1920} fps={30} durationInFrames={KINDN_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="KindNZH" component={KindN} width={1080} height={1920} fps={30} durationInFrames={KINDN_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="SongEN" component={Song} width={1080} height={1920} fps={30} durationInFrames={SONG_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="SongZH" component={Song} width={1080} height={1920} fps={30} durationInFrames={SONG_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
    <Composition id="Ep1EN" component={Ep1} width={1080} height={1920} fps={30} durationInFrames={EP1_EN_FRAMES} defaultProps={{lang: 'en' as const}} />
    <Composition id="Ep1ZH" component={Ep1} width={1080} height={1920} fps={30} durationInFrames={EP1_ZH_FRAMES} defaultProps={{lang: 'zh' as const}} />
  </>
);
