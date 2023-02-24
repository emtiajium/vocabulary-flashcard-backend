import { IsBoolean, IsNotEmptyObject, isObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import Pagination from '@/common/domains/Pagination';
import { plainToClass, Transform, Type } from 'class-transformer';
import Sort from '@/common/domains/Sort';
import VocabularySearchCoverage from '@/vocabulary/domains/VocabularySearchCoverage';

export default class VocabularySearchRequest {
    @IsOptional()
    @IsString()
    searchKeyword?: string;

    @Transform(({ value }) => {
        if (isObject(value)) {
            return plainToClass(VocabularySearchCoverage, value);
        }
        // backward compatibility for the Android app older than or equal to 0.10.4
        const compatibleVocabularySearchCoverage = new VocabularySearchCoverage();
        compatibleVocabularySearchCoverage.setWord(true);
        return compatibleVocabularySearchCoverage;
    })
    @IsOptional()
    @IsNotEmptyObject()
    @ValidateNested()
    vocabularySearchCoverage?: VocabularySearchCoverage;

    @IsOptional()
    @IsBoolean()
    fetchNotHavingDefinitionOnly?: boolean;

    @IsOptional()
    @IsBoolean()
    fetchFlashcard?: boolean;

    @Type(() => Pagination)
    @IsNotEmptyObject()
    @ValidateNested()
    pagination: Pagination;

    @Type(() => Sort)
    @IsOptional()
    @IsNotEmptyObject()
    @ValidateNested()
    sort?: Sort;
}
