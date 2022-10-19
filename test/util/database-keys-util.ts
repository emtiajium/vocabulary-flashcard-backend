import { getManager } from 'typeorm';

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

export async function getPrimaryKeys(tableName: string): Promise<string[]> {
    const queryResult = await getConstraints(tableName, 'PRIMARY KEY');
    return queryResult.map(({ constraintName }) => constraintName);
}

export async function getForeignKeys(tableName: string): Promise<string[]> {
    const queryResult = await getConstraints(tableName, 'FOREIGN KEY');
    return queryResult.map(({ constraintName }) => constraintName);
}

export async function getUniqueKeys(tableName: string): Promise<string[]> {
    const queryResult = await getConstraints(tableName, 'UNIQUE');
    return queryResult.map(({ constraintName }) => constraintName);
}

export async function getIndexKeys(tableName: string): Promise<string[]> {
    const queryResult: { indexName: string }[] = await getManager().query(
        `
            SELECT indexname AS "indexName"
            FROM pg_catalog.pg_indexes
            WHERE indexdef ILIKE '%CREATE INDEX%'
              AND indexdef NOT ILIKE '%CREATE UNIQUE INDEX%'
              AND tablename = $1;
        `,
        [tableName],
    );

    return queryResult.map(({ indexName }) => indexName);
}
