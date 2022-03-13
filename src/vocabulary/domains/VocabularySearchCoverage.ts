import { IsBoolean } from 'class-validator';

export default class VocabularySearchCoverage {
    @IsBoolean()
    word: boolean;

    @IsBoolean()
    linkerWord: boolean;

    @IsBoolean()
    genericNote: boolean;

    @IsBoolean()
    meaning: boolean;

    @IsBoolean()
    example: boolean;

    @IsBoolean()
    note: boolean;
}
