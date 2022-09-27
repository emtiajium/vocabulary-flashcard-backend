/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { MigrationInterface, QueryRunner } from 'typeorm';

type PrimaryKey = {
    table: string;
    existingKey: string;
    newKey: string;
};

export default class StandardizePrimaryKeys1664089206512 implements MigrationInterface {
    dbKeys: Record<string, Record<string, string>> = {
        Android: {
            PK_3fe973762b02beb588017ae3020: 'PK_Android_id',
        },
        Cohort: {
            PK_0f7506a92ede988d30b6711eceb: 'PK_Cohort_id',
        },
        Definition: {
            PK_003fe4d8a86668183e853ad6d42: 'PK_Definition_id',
        },
        LeitnerSystems: {
            PK_469e734c0ea599ab46ae8740cf4: 'PK_LeitnerSystems_id',
        },
        User: {
            PK_9862f679340fb2388436a5ab3e4: 'PK_User_id',
        },
        Vocabulary: {
            PK_69bf4663e87cc7baaf8ab3a8259: 'PK_Vocabulary_id',
        },
    };

    getPrimaryKeys(): PrimaryKey[] {
        const primaryKeys: PrimaryKey[] = [];

        Object.keys(this.dbKeys).forEach((table) => {
            Object.keys(this.dbKeys[table]).forEach((key) => {
                primaryKeys.push({
                    table,
                    existingKey: key,
                    newKey: this.dbKeys[table][key],
                });
            });
        });

        return primaryKeys;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const primaryKeys = this.getPrimaryKeys();

        for (const primaryKey of primaryKeys) {
            await queryRunner.query(`ALTER TABLE "${primaryKey.table}"
                RENAME CONSTRAINT "${primaryKey.existingKey}" TO "${primaryKey.newKey}";
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const primaryKeys = this.getPrimaryKeys();

        for (const primaryKey of primaryKeys) {
            await queryRunner.query(`ALTER TABLE "${primaryKey.table}"
                RENAME CONSTRAINT "${primaryKey.newKey}" TO "${primaryKey.existingKey}";
            `);
        }
    }
}
