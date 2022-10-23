import { getConnection, getManager } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { ForeignKeyMetadata } from 'typeorm/metadata/ForeignKeyMetadata';
import { IndexMetadata } from 'typeorm/metadata/IndexMetadata';
import { UniqueMetadata } from 'typeorm/metadata/UniqueMetadata';

export function getTableNames(): string[] {
    return getConnection().entityMetadatas.map((metadata) => metadata.tableName);
}

export function getPrimaryColumnsMetadata(tableName: string): ColumnMetadata[] {
    const { primaryColumns } = getConnection().entityMetadatas.find((metadata) => metadata.tableName === tableName);
    return primaryColumns;
}

export function getForeignKeysMetadata(tableName: string): ForeignKeyMetadata[] {
    const { foreignKeys } = getConnection().entityMetadatas.find((metadata) => metadata.tableName === tableName);
    return foreignKeys;
}

export function getIndexMetadata(tableName: string): IndexMetadata[] {
    const { indices } = getConnection().entityMetadatas.find((metadata) => metadata.tableName === tableName);
    return indices;
}

export function getUniqueMetadata(tableName: string): UniqueMetadata[] {
    const { uniques } = getConnection().entityMetadatas.find((metadata) => metadata.tableName === tableName);
    return uniques;
}

function getConstraints(
    tableName: string,
    constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE',
): Promise<{ constraintName: string }[]> {
    return getManager().query(
        `
            SELECT DISTINCT (tc.constraint_name) AS "constraintName"
            FROM information_schema.key_column_usage kcu
                     INNER JOIN information_schema.table_constraints tc
                                ON kcu.table_name = tc.table_name
                                    AND kcu.table_name = $1
                                    AND tc.table_name = $1
                                    AND kcu.constraint_name = tc.constraint_name
                                    AND tc.constraint_type = $2;
        `,
        [tableName, constraintType],
    );
}

export async function getPrimaryKeyWithinTable(tableName: string): Promise<string> {
    const queryResult = await getConstraints(tableName, 'PRIMARY KEY');
    return queryResult.map(({ constraintName }) => constraintName)[0];
}

export async function getForeignKeysWithinTable(tableName: string): Promise<string[]> {
    const queryResult = await getConstraints(tableName, 'FOREIGN KEY');
    return queryResult.map(({ constraintName }) => constraintName);
}

export async function getUniqueKeysWithinTable(tableName: string): Promise<string[]> {
    const queryResult = await getConstraints(tableName, 'UNIQUE');
    return queryResult.map(({ constraintName }) => constraintName);
}

export async function getIndexKeysWithinTable(tableName: string): Promise<string[]> {
    const queryResult: { indexName: string }[] = await getManager().query(
        `
            SELECT indexname AS "indexName"
            FROM pg_catalog.pg_indexes
            WHERE (indexdef ILIKE '%CREATE INDEX%'
                OR indexdef ILIKE '%CREATE UNIQUE INDEX%')
              AND tablename = $1;
        `,
        [tableName],
    );

    return queryResult.map(({ indexName }) => indexName);
}
