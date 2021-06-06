import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { lastnameSize, profilePictureUrlSize, usernameSize } from '@/user/domains/User';

export default class CreateUserTable1622268797427 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.connection.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.createTable(
            new Table({
                name: 'User',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        generationStrategy: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp with time zone',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp with time zone',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'version',
                        type: 'int4',
                        default: 1,
                        isNullable: false,
                    },
                    {
                        name: 'username',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'firstname',
                        type: 'varchar',
                        length: `${usernameSize}`,
                        isNullable: false,
                    },
                    {
                        name: 'lastname',
                        type: 'varchar',
                        length: `${lastnameSize}`,
                        isNullable: true,
                    },
                    {
                        name: 'profilePictureUrl',
                        type: 'varchar',
                        length: `${profilePictureUrlSize}`,
                        isNullable: true,
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('User');
    }
}
