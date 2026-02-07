import { MigrationInterface, QueryRunner } from 'typeorm';

interface ForeignKey {
    table: string;
    existingKey: string;
    newKey: string;
}

export default class StandardizeForeignKeys1664085716276 implements MigrationInterface {
    dbKeys: Record<string, Record<string, string>> = {
        Definition: {
            FK_d4e5438be65ed162564afa8e761: 'FK_Definition_vocabularyId_Vocabulary_id',
        },
        LeitnerSystems: {
            FK_7a147763a17dbfc51b8c872e477: 'FK_LeitnerSystems_userId_User_id',
            FK_876d2fcbada3471b1b47cf1cd77: 'FK_LeitnerSystems_vocabularyId_Vocabulary_id',
        },
        User: {
            FK_9610a513a6cd2a6bbb862278751: 'FK_User_cohortId_Cohort_id',
        },
        Vocabulary: {
            FK_17d8da9e552de9f4c48eba2829f: 'FK_Vocabulary_cohortId_Cohort_id',
        },
    };

    getForeignKeys(): ForeignKey[] {
        const foreignKeys: ForeignKey[] = [];

        Object.keys(this.dbKeys).forEach((table) => {
            Object.keys(this.dbKeys[table]).forEach((key) => {
                foreignKeys.push({
                    table,
                    existingKey: key,
                    newKey: this.dbKeys[table][key],
                });
            });
        });

        return foreignKeys;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const foreignKeys = this.getForeignKeys();

        for (const foreignKey of foreignKeys) {
            await queryRunner.query(`ALTER TABLE "${foreignKey.table}"
                RENAME CONSTRAINT "${foreignKey.existingKey}" TO "${foreignKey.newKey}";
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const foreignKeys = this.getForeignKeys();

        for (const foreignKey of foreignKeys) {
            await queryRunner.query(`ALTER TABLE "${foreignKey.table}"
                RENAME CONSTRAINT "${foreignKey.newKey}" TO "${foreignKey.existingKey}";
            `);
        }
    }
}
