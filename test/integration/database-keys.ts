/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

import { Connection, getConnection } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import DatabaseNamingStrategy from '@/common/persistence/DatabaseNamingStrategy';
import { getForeignKeys, getIndexKeys, getPrimaryKeys, getUniqueKeys } from '@test/util/database-keys-util';

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
            const [primaryKey] = await getPrimaryKeys(tableName);

            const { primaryColumns } = dbConnection.entityMetadatas.find(
                (metadata) => metadata.tableName === tableName,
            );

            // Act
            const primaryKeyName = new DatabaseNamingStrategy().primaryKeyName(
                tableName,
                primaryColumns.map((primaryColumn) => primaryColumn.databaseName),
            );

            // Assert
            expect(primaryKeyName).toBe(primaryKey);
        }
    });

    test(`Foreign Keys`, async () => {
        for (const tableName of tableNames) {
            const foreignKeysNames = await getForeignKeys(tableName);

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
                expect(foreignKeysNames).toContain(foreignKeyName);
            });
        }
    });

    test(`Index Keys`, async () => {
        for (const tableName of tableNames) {
            const indexKeysNames = await getIndexKeys(tableName);

            const { indices } = dbConnection.entityMetadatas.find((metadata) => metadata.tableName === tableName);

            indices.forEach((index) => {
                // Act
                const indexName = new DatabaseNamingStrategy().indexName(
                    tableName,
                    index.columns.map((column) => column.databaseName),
                );

                // Assert
                expect(indexKeysNames).toContain(indexName);
            });
        }
    });

    test(`Unique Keys`, async () => {
        for (const tableName of tableNames) {
            const uniqueKeysNames = await getUniqueKeys(tableName);

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
                expect(uniqueKeysNames).toContain(uniqueKeyName);
            });
        }
    });
});
