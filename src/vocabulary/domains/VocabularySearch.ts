import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import Pagination from '@/common/domains/Pagination';
import { Type } from 'class-transformer';
import Sort from '@/common/domains/Sort';

export default class VocabularySearch {
    @IsOptional()
    @IsString()
    searchKeyword?: string;

    @IsOptional()
    @IsBoolean()
    fetchNotHavingDefinitionOnly?: boolean;

    @Type(() => Pagination)
    @IsNotEmpty()
    @ValidateNested({ each: true })
    pagination: Pagination;

    @Type(() => Sort)
    @IsOptional()
    @ValidateNested()
    sort?: Sort;
}
