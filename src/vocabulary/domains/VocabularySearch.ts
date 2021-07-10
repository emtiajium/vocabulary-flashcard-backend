import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import Pagination from '@/common/domains/Pagination';
import { Type } from 'class-transformer';
import Sort from '@/common/domains/Sort';

export default class VocabularySearch {
    @IsString()
    @IsOptional()
    searchKeyword?: string;

    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => Pagination)
    pagination: Pagination;

    @ValidateNested()
    @IsOptional()
    @Type(() => Sort)
    sort?: Sort;
}
