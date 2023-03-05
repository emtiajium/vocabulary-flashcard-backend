import { MigrationInterface, QueryRunner } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

export default class RelateLinkerWords1678015289009 implements MigrationInterface {
    // eslint-disable-next-line consistent-return
    public async up(queryRunner: QueryRunner): Promise<void> {
        const vocabulariesHavingLinkerWords: Vocabulary[] = await queryRunner.query(`
            SELECT id, word, "linkerWords", "cohortId"
            FROM "Vocabulary"
            WHERE "linkerWords" != '{}';
        `);

        if (!vocabulariesHavingLinkerWords?.length) {
            return Promise.resolve();
        }

        const words = [...new Set(vocabulariesHavingLinkerWords.flatMap(({ linkerWords }) => linkerWords))];

        const vocabularies: Vocabulary[] = await queryRunner.query(
            `
                SELECT id, word, "linkerWords", "cohortId"
                FROM "Vocabulary"
                WHERE LOWER(word) IN (${words.map((_, index) => `$${index + 1}`)});
            `,
            [...words.map((word) => word.toLowerCase().trim())],
        );

        /* eslint-disable no-restricted-syntax */
        /* eslint-disable no-await-in-loop */
        for (const vocabulary of vocabularies) {
            const vocab = vocabulariesHavingLinkerWords.find(
                (vocabularyHavingLinkerWords) =>
                    vocabularyHavingLinkerWords.cohortId === vocabulary.cohortId &&
                    vocabularyHavingLinkerWords.linkerWords
                        .map((_) => _.toLowerCase())
                        .includes(vocabulary.word.toLowerCase()),
            );

            if (!vocabulary?.linkerWords.includes(vocab.word)) {
                await queryRunner.query(
                    `
                        UPDATE "Vocabulary"
                        SET "linkerWords" = $2
                        WHERE id = $1;
                    `,
                    [vocabulary.id, [...vocabulary.linkerWords, vocab.word]],
                );
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async down(queryRunner: QueryRunner): Promise<void> {
        // do nothing
    }
}
