/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

import { Connection, getConnection, getManager } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';

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
            const { primaryColumns } = dbConnection.entityMetadatas.find(
                (metadata) => metadata.tableName === tableName,
            );

            for (const primaryColumn of primaryColumns) {
                const [{ primaryKeyName }] = await getManager().query(
                    `
                        SELECT tc.constraint_name AS "primaryKeyName"
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

                expect(primaryKeyName).toBe(`PK_${tableName}_${primaryColumn.databaseName}`);
            }
        }
    });

    test(`Foreign Keys`, () => {
        for (const tableName of tableNames) {
            const { foreignKeys } = dbConnection.entityMetadatas.find((metadata) => metadata.tableName === tableName);

            foreignKeys.forEach((foreignKey) => {
                foreignKey.columnNames.forEach((foreignKeyColumnName, index) => {
                    expect(foreignKey.name).toBe(
                        `FK_${tableName}_${foreignKeyColumnName}_${foreignKey.referencedTablePath}_${foreignKey.referencedColumnNames[index]}`,
                    );
                });
            });
        }
    });

    test(`Index Keys`, () => {
        for (const tableName of tableNames) {
            const { indices } = dbConnection.entityMetadatas.find((metadata) => metadata.tableName === tableName);

            indices.forEach((index) => {
                expect(index.name).toBe(
                    `IDX_${tableName}_${index.columns.map((column) => column.databaseName).join('_')}`,
                );
            });
        }
    });

    test(`Unique Keys`, () => {
        for (const tableName of tableNames) {
            const { uniques: uniqueKeys } = dbConnection.entityMetadatas.find(
                (metadata) => metadata.tableName === tableName,
            );

            uniqueKeys.forEach((uniqueKey) => {
                expect(uniqueKey.name).toBe(
                    `UQ_${tableName}_${uniqueKey.columns.map((column) => column.databaseName).join('_')}`,
                );
            });
        }
    });
});
