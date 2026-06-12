import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { ForeignKeyMetadata } from 'typeorm/metadata/ForeignKeyMetadata';
import { IndexMetadata } from 'typeorm/metadata/IndexMetadata';
import { UniqueMetadata } from 'typeorm/metadata/UniqueMetadata';
import DataSource from '@/common/persistence/TypeormConfig';

export function getTableNames(): string[] {
    return DataSource.entityMetadatas.map((metadata) => metadata.tableName);
}

export function getPrimaryColumnsMetadata(tableName: string): ColumnMetadata[] {
    const { primaryColumns } = DataSource.entityMetadatas.find((metadata) => metadata.tableName === tableName);
    return primaryColumns;
}

export function getForeignKeysMetadata(tableName: string): ForeignKeyMetadata[] {
    const { foreignKeys } = DataSource.entityMetadatas.find((metadata) => metadata.tableName === tableName);
    return foreignKeys;
}

export function getIndexMetadata(tableName: string): IndexMetadata[] {
    const { indices } = DataSource.entityMetadatas.find((metadata) => metadata.tableName === tableName);
    return indices;
}

export function getUniqueMetadata(tableName: string): UniqueMetadata[] {
    const { uniques } = DataSource.entityMetadatas.find((metadata) => metadata.tableName === tableName);
    return uniques;
}

function getConstraints(
    tableName: string,
    constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE',
): Promise<{ constraintName: string }[]> {
    return DataSource.query(
        /* sql */ `
            select distinct
                (tc.constraint_name) as "constraintName"
            from
                information_schema.key_column_usage kcu
                inner join information_schema.table_constraints tc on kcu.table_name = tc.table_name
                and kcu.table_name = $1
                and tc.table_name = $1
                and kcu.constraint_name = tc.constraint_name
                and tc.constraint_type = $2;
        `,
        [tableName, constraintType],
    );
}

export async function getPrimaryKeyWithinTable(tableName: string): Promise<string> {
    const queryResult = await getConstraints(tableName, 'PRIMARY KEY');
    return queryResult.map(({ constraintName }) => constraintName)[0];
}

export async function getAllPrimaryKeys(tableNames: string[]): Promise<Record<string, string>> {
    const responseMap: Record<string, string> = {};

    await Promise.all(
        tableNames.map(async (tableName) => {
            responseMap[tableName] = await getPrimaryKeyWithinTable(tableName);
        }),
    );

    return responseMap;
}

export async function getForeignKeysWithinTable(tableName: string): Promise<string[]> {
    const queryResult = await getConstraints(tableName, 'FOREIGN KEY');
    return queryResult.map(({ constraintName }) => constraintName);
}

export async function getAllForeignKeys(tableNames: string[]): Promise<Record<string, string[]>> {
    const responseMap: Record<string, string[]> = {};

    await Promise.all(
        tableNames.map(async (tableName) => {
            responseMap[tableName] = await getForeignKeysWithinTable(tableName);
        }),
    );

    return responseMap;
}

export async function getUniqueKeysWithinTable(tableName: string): Promise<string[]> {
    const queryResult = await getConstraints(tableName, 'UNIQUE');
    return queryResult.map(({ constraintName }) => constraintName);
}

export async function getAllUniqueKeys(tableNames: string[]): Promise<Record<string, string[]>> {
    const responseMap: Record<string, string[]> = {};

    await Promise.all(
        tableNames.map(async (tableName) => {
            responseMap[tableName] = await getUniqueKeysWithinTable(tableName);
        }),
    );

    return responseMap;
}

export async function getIndexKeysWithinTable(tableName: string): Promise<string[]> {
    const queryResult: { indexName: string }[] = await DataSource.query(
        /* sql */ `
            select
                indexname as "indexName"
            from
                pg_catalog.pg_indexes
            where
                (
                    indexdef ilike '%CREATE INDEX%'
                    or indexdef ilike '%CREATE UNIQUE INDEX%'
                )
                and tablename = $1;
        `,
        [tableName],
    );

    return queryResult.map(({ indexName }) => indexName);
}

export async function getAllIndexKeys(tableNames: string[]): Promise<Record<string, string[]>> {
    const responseMap: Record<string, string[]> = {};

    await Promise.all(
        tableNames.map(async (tableName) => {
            responseMap[tableName] = await getIndexKeysWithinTable(tableName);
        }),
    );

    return responseMap;
}
