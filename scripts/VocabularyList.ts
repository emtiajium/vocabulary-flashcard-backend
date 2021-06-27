import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';

type CustomDefinition = Required<Pick<Definition, 'meaning' | 'examples' | 'notes' | 'externalLinks'>>;
type VocabularyWithoutDefinitions = Required<
    Pick<Vocabulary, 'word' | 'linkerWords' | 'genericNotes' | 'genericExternalLinks'>
>;
type CustomVocabulary = Required<VocabularyWithoutDefinitions & { definitions: CustomDefinition[] }>;

const VocabularyList: CustomVocabulary[] = [
    {
        word: 'Ecstasy',
        definitions: [
            {
                meaning: 'an overwhelming feeling of great happiness',
                examples: [
                    'We shared a moment of ecstasy as the chocolate melted on our tongues.',
                    'Do anything, but let it produce joy. Do anything, but let it yield ecstasy.',
                ],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Indefensible',
        definitions: [
            {
                meaning: 'অরক্ষণীয়',
                examples: ['the towns were tactically indefensible'],
                notes: [],
                externalLinks: [],
            },
            {
                meaning: 'একান্ত অযৌক্তিক',
                examples: ['His opinions/attitudes are completely indefensible.'],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Juxtaposition',
        definitions: [
            {
                meaning:
                    'an act or instance of placing two elements close together or side by side (তুলনা করার বিদ্যা)',
                examples: ['The juxtaposition of the colour images stimulates the imagination.'],
                notes: ['নাবিলা লিটল প্রিন্স ছাতার পাশে কলম রেখে ছবি তুলেছিল ছাতাটা কতটা ছোট সেটা তুলনা করার জন্য'],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Polemical',
        definitions: [
            {
                meaning: 'strongly attacking or defending a particular opinion, person, idea, or set of beliefs',
                examples: ['The next step is to find experts to write passionate and polemical pieces on each topic.'],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Depredation',
        definitions: [
            {
                meaning: 'an act of attacking',
                examples: [
                    'Depredation of (= damage done to) the environment is destroying hundreds of species each year.',
                ],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Abase',
        definitions: [
            {
                meaning: 'Degrading someone সামাজিকভাবে ছোট দেখানো',
                examples: ["Don't abase Bishan for his English accent."],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Cabal',
        definitions: [
            {
                meaning: 'Plotting against something in group ষড়যন্ত্র',
                examples: [
                    "The garments workers formed a cabal to demonstrate their dissatisfaction with the company's health benefits.",
                ],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Baconian',
        definitions: [
            {
                meaning: 'Bacon method/philosophy রবীন্দ্র থেকে রাবিন্দ্রিক এর মত',
                examples: [
                    'Baconian method was influential upon the development of the scientific method in modern science; but also more generally in the early modern rejection of medieval Aristotelianism.',
                ],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Earnest',
        definitions: [
            {
                meaning: 'Sincere আন্তরিক',
                examples: ['I had earnest desire to love someone'],
                notes: ['কিন্তু কপালে সবার নাকি সুখ সহে না'],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Darkling',
        definitions: [
            {
                meaning: 'Obscure, Shaded, gloomy অন্ধকারাচ্ছন্ন',
                examples: ['I lost myself in the serenity of the darkling forest.'],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Fabricate',
        definitions: [
            {
                meaning: 'Imitate, invent falsely, counterfeit নকল',
                examples: ['He is accused of fabricating confidential company info.'],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Gaiety',
        definitions: [
            {
                meaning: 'Delight, admiration আহ্লাদ ফুর্তি',
                examples: ['We enjoy the gaiety of Noboborsho.'],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Amenities',
        definitions: [
            {
                meaning: 'Benefit, comfort সুযোগ সুবিধা',
                examples: [
                    'Residents of Texas get limited amenities compared to any other states of US.',
                    'Most people struggle to lead a life with basic amenities.',
                ],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Divulge',
        definitions: [
            {
                meaning: 'Blurt out, uncover ফাঁস করা',
                examples: [
                    'She was offered 10 millions by the competitor’s informant for only the sales data of the company she works for. But she refused to divulge it as she prioritized honesty and loyalty other than everything.',
                ],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Conurbation',
        definitions: [
            {
                meaning:
                    'Merging two or more communities (especially urban) for the greater advantage of their people. সংমিশ্রণ',
                examples: [
                    'Conurbation of Sylhet and Chattogram industrial zone may create huge employment opportunities for young people.',
                ],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Waning',
        definitions: [
            {
                meaning: 'Fadeaway, Decrescent ক্ষীয়মান',
                examples: ['I couldn’t see his facial expression as the moonlight was waning.'],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Interred',
        definitions: [
            {
                meaning: 'sowed, planted into, buried, driven into সমাহিত (করা',
                examples: ["Actress Kabari's body was interred at Banani graveyard."],
                notes: [],
                externalLinks: [],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
    {
        word: 'Debris',
        definitions: [
            {
                meaning: 'broken or torn pieces left from the destruction of something larger',
                examples: [
                    'Sometimes we have to dig through the debris to find who we really are, and what we truly want and what is worth fighting for.',
                    'Sometimes caterpillars collect debris for constructing a mobile case so that they camouflage to deceive the predators.',
                    'A toxic relationship leaves people with debris, but once psychological adjustments, physical adjustments and environmental adjustments happen, the coping becomes easier.',
                ],
                notes: [],
                externalLinks: ['https://www.facebook.com/watch/?v=3985837661509712'],
            },
        ],
        linkerWords: [],
        genericNotes: [],
        genericExternalLinks: [],
    },
];

export default VocabularyList;
