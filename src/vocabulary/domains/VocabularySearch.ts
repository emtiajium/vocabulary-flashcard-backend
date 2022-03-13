import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import Pagination from '@/common/domains/Pagination';
import { Type } from 'class-transformer';
import Sort from '@/common/domains/Sort';
import VocabularySearchCoverage from '@/vocabulary/domains/VocabularySearchCoverage';

export default class VocabularySearch {
    @IsOptional()
    @IsString()
    searchKeyword?: string;

    @Type(() => VocabularySearchCoverage)
    @IsOptional()
    @ValidateNested()
    vocabularySearchCoverage?: VocabularySearchCoverage;

    @IsOptional()
    @IsBoolean()
    fetchNotHavingDefinitionOnly?: boolean;

    @Type(() => Pagination)
    @IsNotEmpty()
    @ValidateNested()
    pagination: Pagination;

    @Type(() => Sort)
    @IsOptional()
    @ValidateNested()
    sort?: Sort;
}
