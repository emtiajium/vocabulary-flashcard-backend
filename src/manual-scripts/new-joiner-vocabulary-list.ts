import PartialVocabulary from '@/vocabulary/domains/PartialVocabulary';
import vocabularyList from '@/manual-scripts/vocabulary-list';
import * as _ from 'lodash';

const words: string[] = [
    'Porpoise',
    'Sabbatical',
    'Faff',
    'Run round like a headless chicken',
    'Poggers',
    `devil's advocate`,
    'Reverberate',
    'Insatiable',
    'Gaslighting',
    'Equanimity',
    'Speculate',
    'Swagger',
    'Indelible',
    'Hog',
    'Choke',
    'Reel off (something)',
    'Euphemism',
    'Guerrilla marketing',
    'Portmanteau word',
    'Trickle',
    'Rechristen',
    'Snowclone',
    'Spoonerism',
    'Schadenfreude',
    'Malapropisms',
    'Intonation',
    'Buoyancy',
    'Grandiose',
    'Huddle',
    'Take the bull by the horns',
    'Podiatrist',
    'Persnickety',
    'Lament',
    'Paint the town red',
    'Founder',
    'In a fit of pique',
    'Dutch door',
    'Catcall',
    'Heyday',
    'Oxymoron',
    'Ward off',
];

const newJoinerVocabularyList: PartialVocabulary[] = _.filter(vocabularyList, (vocabulary) => {
    return _.includes(words, vocabulary.word);
});

export default newJoinerVocabularyList;
