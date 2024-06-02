import { MigrationInterface, QueryRunner } from 'typeorm';

export class WordMeaningInGuessingGameTable1717321421822 implements MigrationInterface {
    name = 'WordMeaningInGuessingGameTable1717321421822';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "GuessingGame"
                ADD "meaning" character varying NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "GuessingGame"
                ADD "word" character varying NULL
        `);

        await queryRunner.query(`
            with "FilteredGuessingGame" as
                     (select "GuessingGame"."definitionId"
                      from "GuessingGame"),
                 "FilteredDefinition" as (select "Definition".id, "Definition".meaning, "Vocabulary".word
                                          from "Definition"
                                                   inner join "Vocabulary" on "Definition"."vocabularyId" = "Vocabulary".id
                                          where "Definition".id in (select "definitionId" from "FilteredGuessingGame"))
            update "GuessingGame"
            set word    = "FilteredDefinition".word,
                meaning = "FilteredDefinition".meaning
            from "FilteredDefinition"
            where "GuessingGame"."definitionId" = "FilteredDefinition".id;
        `);

        await queryRunner.query(`
            ALTER TABLE "GuessingGame"
                ALTER COLUMN "meaning" SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "GuessingGame"
                ALTER COLUMN "word" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "GuessingGame"
                DROP COLUMN "word"
        `);
        await queryRunner.query(`
            ALTER TABLE "GuessingGame"
                DROP COLUMN "meaning"
        `);
    }
}
