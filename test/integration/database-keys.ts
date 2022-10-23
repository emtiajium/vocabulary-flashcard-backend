/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import DatabaseNamingStrategy from '@/common/persistence/DatabaseNamingStrategy';
import {
    getForeignKeysWithinTable,
    getForeignKeysMetadata,
    getIndexKeysWithinTable,
    getIndexMetadata,
    getPrimaryColumnsMetadata,
    getPrimaryKeyWithinTable,
    getTableNames,
    getUniqueKeysWithinTable,
    getUniqueMetadata,
} from '@test/util/database-keys-util';

describe('Database Keys', () => {
    let app: INestApplication;

    let tableNames: string[] = [];

    beforeAll(async () => {
        app = await kickOff(AppModule);

        tableNames = getTableNames();
    });

    afterAll(async () => {
        await app.close();
    });

    test(`Primary Keys`, async () => {
        // Arrange
        for (const tableName of tableNames) {
            const primaryKey = await getPrimaryKeyWithinTable(tableName);
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
            const foreignKeysNames = await getForeignKeysWithinTable(tableName);
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
            const indexKeysNames = await getIndexKeysWithinTable(tableName);
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
            const uniqueKeysNames = await getUniqueKeysWithinTable(tableName);
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
