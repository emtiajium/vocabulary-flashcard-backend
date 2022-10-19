/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

import { Connection, getConnection, getManager } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import DatabaseNamingStrategy from '@/common/persistence/DatabaseNamingStrategy';

describe('Database Keys', () => {
    let app: INestApplication;

    let dbConnection: Connection;
    let tableNames: string[] = [];

    beforeAll(async () => {
        app = await kickOff(AppModule);

        dbConnection = await getConnection();
        tableNames = dbConnection.entityMetadatas.map((metadata) => metadata.tableName);
    });

    afterAll(async () => {
        await app.close();
    });

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

    function getIndexName(tableName: string): Promise<{ indexName: string }[]> {
        return getManager().query(
            `
                SELECT indexname AS "indexName"
                FROM pg_catalog.pg_indexes
                WHERE indexdef ILIKE '%CREATE INDEX%'
                  AND indexdef NOT ILIKE '%CREATE UNIQUE INDEX%'
                  AND tablename = $1;
            `,
            [tableName],
        );
    }

    test(`Primary Keys`, async () => {
        for (const tableName of tableNames) {
            const queryResult = await getConstraints(tableName, 'PRIMARY KEY');

            const { primaryColumns } = dbConnection.entityMetadatas.find(
                (metadata) => metadata.tableName === tableName,
            );

            // Act
            const primaryKeyName = new DatabaseNamingStrategy().primaryKeyName(
                tableName,
                primaryColumns.map((primaryColumn) => primaryColumn.databaseName),
            );

            // Assert
            expect(primaryKeyName).toBe(queryResult[0].constraintName);
        }
    });

    test(`Foreign Keys`, async () => {
        for (const tableName of tableNames) {
            const queryResult = await getConstraints(tableName, 'FOREIGN KEY');

            const { foreignKeys } = dbConnection.entityMetadatas.find((metadata) => metadata.tableName === tableName);

            foreignKeys.forEach((foreignKey) => {
                // Act
                const foreignKeyName = new DatabaseNamingStrategy().foreignKeyName(
                    tableName,
                    foreignKey.columnNames,
                    foreignKey.referencedTablePath,
                    foreignKey.referencedColumnNames,
                );

                // Assert
                expect(queryResult).toContainEqual({
                    constraintName: foreignKeyName,
                });
            });
        }
    });

    test(`Index Keys`, async () => {
        for (const tableName of tableNames) {
            const queryResult = await getIndexName(tableName);

            const { indices } = dbConnection.entityMetadatas.find((metadata) => metadata.tableName === tableName);

            indices.forEach((index) => {
                // Act
                const indexName = new DatabaseNamingStrategy().indexName(
                    tableName,
                    index.columns.map((column) => column.databaseName),
                );

                // Assert
                expect(queryResult).toContainEqual({
                    indexName,
                });
            });
        }
    });

    test(`Unique Keys`, async () => {
        for (const tableName of tableNames) {
            const queryResult = await getConstraints(tableName, 'UNIQUE');

            const { uniques: uniqueKeys } = dbConnection.entityMetadatas.find(
                (metadata) => metadata.tableName === tableName,
            );

            uniqueKeys.forEach((uniqueKey) => {
                // Act
                const uniqueKeyName = new DatabaseNamingStrategy().uniqueConstraintName(
                    tableName,
                    uniqueKey.columns.map((column) => column.databaseName),
                );

                // Assert
                expect(queryResult).toContainEqual({
                    constraintName: uniqueKeyName,
                });
            });
        }
    });
});
