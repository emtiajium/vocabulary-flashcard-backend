import { MigrationInterface, QueryRunner } from 'typeorm';

export class GuessGame1716350916749 implements MigrationInterface {
    name = 'GuessGame1716350916749';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNLOGGED TABLE "GuessingGame"
            (
                "id"           uuid                     NOT NULL DEFAULT uuid_generate_v4(),
                "definitionId" uuid                     NOT NULL,
                "userId"       uuid                     NOT NULL,
                "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_GuessingGame_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "GuessingGame"
        `);
    }
}
