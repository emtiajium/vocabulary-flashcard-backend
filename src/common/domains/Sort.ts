import { IsEnum, IsString } from 'class-validator';

export enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC',
}

export enum SupportedSortFields {
    createdAt = 'createdAt',
}

export default class Sort {
    @IsString()
    @IsEnum(SupportedSortFields)
    field: string;

    @IsString()
    @IsEnum(SortDirection)
    direction: SortDirection;

    constructor(field?: string, direction?: SortDirection) {
        this.field = field || SupportedSortFields.createdAt;
        this.direction = direction || SortDirection.DESC;
    }
}
