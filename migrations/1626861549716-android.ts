import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class Android1626861549716 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'Android',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        generationStrategy: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'versionCode',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'versionName',
                        type: 'varchar',
                        isNullable: false,
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('Android');
    }
}
