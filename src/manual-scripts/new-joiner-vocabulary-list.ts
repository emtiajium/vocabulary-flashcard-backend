import PartialVocabulary from '@/vocabulary/domains/PartialVocabulary';
import vocabularyList from '@/manual-scripts/vocabulary-list';
import * as _ from 'lodash';

const words: string[] = [
    `Juxtaposition`,
    `Debris`,
    `Black swan`,
    `With pants down`,
    `Clutch`,
    `Sabbatical`,
    `Faff`,
    `Run round like a headless chicken`,
    `Poggers`,
    `devil's advocate`,
    `Reverberate`,
    `Gaslighting`,
    `Equanimity`,
    `Reel off`,
    `Guerrilla marketing`,
    `Consolidation`,
    `Portmanteau word`,
    `Rechristen`,
    `Snowclone`,
    `Spoonerism`,
    `Schadenfreude`,
    `Buoyancy`,
    `Take the bull by the horns`,
    `Persnickety`,
    `Lament`,
    `Paint the town red`,
    `Catcall`,
    `Heyday`,
    `Oxymoron`,
    `Diaspora`,
    `Hot potato`,
    `Morton's toe`,
    `Bone up`,
    `Wallow`,
];

const newJoinerVocabularyList: PartialVocabulary[] = _.filter(_.cloneDeep(vocabularyList), (vocabulary) => {
    return _.includes(words, vocabulary.word);
});

export default newJoinerVocabularyList;
