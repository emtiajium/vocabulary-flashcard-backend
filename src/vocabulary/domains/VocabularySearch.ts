import { IsDefined, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import Pagination from '@/common/domains/Pagination';
import { Type } from 'class-transformer';
import Sort from '@/common/domains/Sort';

export default class VocabularySearch {
    @IsUUID()
    @IsNotEmpty()
    @IsDefined()
    cohortId: string;

    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => Pagination)
    pagination: Pagination;

    @ValidateNested()
    @IsOptional()
    @Type(() => Sort)
    sort?: Sort;
}
