import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Marks a guessing game round as finished.
 *
 * The words dealt to a user used to be re-served for the whole day: the rows created
 * today *were* the round. Once the user answers every word correctly the round is over
 * and the next request should deal a new set, so the round needs an end. The rows stay
 * in the table after that, which keeps them excluded from later rounds.
 */
export default class AddCompletedAtToGuessingGame1717321421823 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'GuessingGame',
            new TableColumn({
                name: 'completedAt',
                type: 'timestamp with time zone',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('GuessingGame', 'completedAt');
    }
}
