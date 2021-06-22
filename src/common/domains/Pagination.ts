import { IsPositive, Max, Min } from 'class-validator';

export const pageSize = 50;

export default class Pagination {
    @IsPositive()
    @Min(1)
    @Max(pageSize)
    pageSize: number;

    @IsPositive()
    @Min(1)
    pageNumber: number;
}
