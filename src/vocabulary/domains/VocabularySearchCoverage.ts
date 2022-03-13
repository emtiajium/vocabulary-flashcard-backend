import { IsBoolean } from 'class-validator';

export default class VocabularySearchCoverage {
    @IsBoolean()
    word: boolean;

    @IsBoolean()
    linkerWords: boolean;

    @IsBoolean()
    genericNotes: boolean;

    @IsBoolean()
    meaning: boolean;

    @IsBoolean()
    examples: boolean;

    @IsBoolean()
    notes: boolean;

    setWord?(word: boolean): void {
        this.word = word;
    }
}
