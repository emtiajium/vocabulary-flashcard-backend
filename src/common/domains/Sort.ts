import { IsEnum, IsString } from 'class-validator';

export enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC',
}

export enum SupportedSortFields {
    createdAt = 'createdAt',
    updatedAt = 'updatedAt',
    word = 'word',
}

export default class Sort {
    @IsString()
    @IsEnum(SupportedSortFields)
    field: SupportedSortFields;

    @IsString()
    @IsEnum(SortDirection)
    direction: SortDirection;

    static getField(sort?: Sort, defaultSortField?: SupportedSortFields): SupportedSortFields {
        return sort?.field || defaultSortField;
    }

    static getDirection(sort?: Sort, defaultSortDirection?: SortDirection): SortDirection {
        return sort?.direction || defaultSortDirection;
    }
}
