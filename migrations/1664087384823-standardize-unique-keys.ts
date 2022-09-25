/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { MigrationInterface, QueryRunner } from 'typeorm';

type UniqueKey = {
    table: string;
    existingKey: string;
    newKey: string;
    columns: string[];
};

export default class StandardizeUniqueKeys1664087384823 implements MigrationInterface {
    dbKeys: Record<string, Record<string, string>> = {
        Cohort: {
            UQ_6916a2e03d9684db4fc1fc9e3f8: 'UQ_Cohort_name',
        },
        LeitnerSystems: {
            unique_userId_vocabularyId: 'UQ_LeitnerSystems_userId_vocabularyId',
        },
        User: {
            UQ_29a05908a0fa0728526d2833657: 'UQ_User_username',
        },
        Vocabulary: {
            unique_word_cohortId: 'UQ_Vocabulary_word_cohortId',
        },
    };

    getUniqueKeys(): UniqueKey[] {
        const uniqueKeys: UniqueKey[] = [];

        Object.keys(this.dbKeys).forEach((table) => {
            Object.keys(this.dbKeys[table]).forEach((key) => {
                uniqueKeys.push({
                    table,
                    existingKey: key,
                    newKey: this.dbKeys[table][key],
                    columns: this.dbKeys[table][key].split(`UQ_${table}_`)[1].split('_'),
                });
            });
        });

        return uniqueKeys;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const uniqueKeys = this.getUniqueKeys();

        for (const uniqueKey of uniqueKeys) {
            await queryRunner.query(`ALTER INDEX "${uniqueKey.existingKey}" RENAME TO "${uniqueKey.newKey}";`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const uniqueKeys = this.getUniqueKeys();

        for (const uniqueKey of uniqueKeys) {
            await queryRunner.query(`ALTER INDEX "${uniqueKey.newKey}" RENAME TO "${uniqueKey.existingKey}";`);
        }
    }
}
