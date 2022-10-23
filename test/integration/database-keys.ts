/* eslint-disable no-restricted-syntax */

import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import DatabaseNamingStrategy from '@/common/persistence/DatabaseNamingStrategy';
import {
    getForeignKeysMetadata,
    getIndexMetadata,
    getPrimaryColumnsMetadata,
    getTableNames,
    getUniqueMetadata,
    getAllPrimaryKeys,
    getAllForeignKeys,
    getAllUniqueKeys,
    getAllIndexKeys,
} from '@test/util/database-keys-util';

describe('Database Keys', () => {
    let app: INestApplication;

    let tableNames: string[] = [];
    let allPrimaryKeys: Record<string, string> = {};
    let allForeignKeys: Record<string, string[]> = {};
    let allIndexKeys: Record<string, string[]> = {};
    let allUniqueKeys: Record<string, string[]> = {};

    beforeAll(async () => {
        app = await kickOff(AppModule);

        tableNames = getTableNames();
        [allPrimaryKeys, allForeignKeys, allIndexKeys, allUniqueKeys] = await Promise.all([
            getAllPrimaryKeys(tableNames),
            getAllForeignKeys(tableNames),
            getAllIndexKeys(tableNames),
            getAllUniqueKeys(tableNames),
        ]);
    });

    afterAll(async () => {
        await app.close();
    });

    test(`Primary Keys`, async () => {
        // Arrange
        for (const tableName of tableNames) {
            const primaryKey = allPrimaryKeys[tableName];
            const primaryColumnsMetadata = getPrimaryColumnsMetadata(tableName);

            // Act
            const primaryKeyName = new DatabaseNamingStrategy().primaryKeyName(
                tableName,
                primaryColumnsMetadata.map((primaryColumnMetadata) => primaryColumnMetadata.databaseName),
            );

            // Assert
            expect(primaryKeyName).toBe(primaryKey);
        }
    });

    test(`Foreign Keys`, async () => {
        // Arrange

        for (const tableName of tableNames) {
            const foreignKeysNames = allForeignKeys[tableName];
            const foreignKeysMetadata = getForeignKeysMetadata(tableName);

            foreignKeysMetadata.forEach((foreignKeyMetadata) => {
                // Act
                const foreignKeyName = new DatabaseNamingStrategy().foreignKeyName(
                    tableName,
                    foreignKeyMetadata.columnNames,
                    foreignKeyMetadata.referencedTablePath,
                    foreignKeyMetadata.referencedColumnNames,
                );

                // Assert
                expect(foreignKeysNames).toContain(foreignKeyName);
            });
        }
    });

    test(`Index Keys`, async () => {
        // Arrange

        for (const tableName of tableNames) {
            const indexKeysNames = allIndexKeys[tableName];
            const indicesMetadata = getIndexMetadata(tableName);

            indicesMetadata.forEach((indexMetadata) => {
                // Act
                const indexName = new DatabaseNamingStrategy().indexName(
                    tableName,
                    indexMetadata.columns.map((column) => column.databaseName),
                );

                // Assert
                expect(indexKeysNames).toContain(indexName);
            });
        }
    });

    test(`Unique Keys`, async () => {
        // Arrange

        for (const tableName of tableNames) {
            const uniqueKeysNames = allUniqueKeys[tableName];
            const uniqueMetadata = getUniqueMetadata(tableName);

            uniqueMetadata.forEach(({ columns }) => {
                // Act
                const uniqueKeyName = new DatabaseNamingStrategy().uniqueConstraintName(
                    tableName,
                    columns.map((column) => column.databaseName),
                );

                // Assert
                expect(uniqueKeysNames).toContain(uniqueKeyName);
            });
        }
    });
});
