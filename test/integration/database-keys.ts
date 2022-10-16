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

    test(`Primary Keys`, async () => {
        for (const tableName of tableNames) {
            const queryResult: { constraintName: string }[] = await getManager().query(
                `
                    SELECT tc.constraint_name AS "constraintName"
                    FROM information_schema.key_column_usage kcu
                             INNER JOIN information_schema.table_constraints tc
                                        ON kcu.table_name = tc.table_name
                                            AND kcu.table_name = $1
                                            AND tc.table_name = $1
                                            AND kcu.constraint_name = tc.constraint_name
                                            AND tc.constraint_type = 'PRIMARY KEY';
                `,
                [tableName],
            );

            const { primaryColumns } = dbConnection.entityMetadatas.find(
                (metadata) => metadata.tableName === tableName,
            );

            queryResult.forEach((currentQueryResult) => {
                // Act
                const primaryKeyName = new DatabaseNamingStrategy().primaryKeyName(
                    tableName,
                    primaryColumns.map((primaryColumn) => primaryColumn.databaseName),
                );

                // Assert
                expect(primaryKeyName).toBe(currentQueryResult.constraintName);
            });
        }
    });

    test(`Foreign Keys`, () => {
        for (const tableName of tableNames) {
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
                expect(foreignKeyName).toBe(foreignKey.name);
            });
        }
    });

    test(`Index Keys`, () => {
        for (const tableName of tableNames) {
            const { indices } = dbConnection.entityMetadatas.find((metadata) => metadata.tableName === tableName);

            indices.forEach((index) => {
                // Act
                const indexName = new DatabaseNamingStrategy().indexName(
                    tableName,
                    index.columns.map((column) => column.databaseName),
                );

                // Assert
                expect(indexName).toBe(index.name);
            });
        }
    });

    test(`Unique Keys`, () => {
        for (const tableName of tableNames) {
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
                expect(uniqueKeyName).toBe(uniqueKey.name);
            });
        }
    });
});
