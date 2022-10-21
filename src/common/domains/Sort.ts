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

    static getField(defaultSortField: SupportedSortFields, sort?: Sort): SupportedSortFields {
        return sort?.field || defaultSortField;
    }

    static getDirection(defaultSortDirection: SortDirection, sort?: Sort): SortDirection {
        return sort?.direction || defaultSortDirection;
    }
}
