import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthSession1793530743224 implements MigrationInterface {
    name = 'AuthSession1793530743224';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(/* sql */ `
            create table "AuthSession" (
                "createdAt" timestamp with time zone not null default now(),
                "updatedAt" timestamp with time zone not null default now(),
                "version" integer not null default '1',
                "id" uuid not null default uuid_generate_v4 (),
                "userId" uuid not null,
                "username" text not null,
                "refreshTokenHash" text not null,
                "expiresAt" timestamp with time zone not null,
                "revokedAt" timestamp with time zone,
                "lastUsedAt" timestamp with time zone,
                constraint "UQ_AuthSession_refreshTokenHash" unique ("refreshTokenHash"),
                constraint "PK_AuthSession_id" primary key ("id")
            )
        `);
        await queryRunner.query(/* sql */ `
            alter table "AuthSession"
            add constraint "FK_AuthSession_userId_User_id" foreign key ("userId") references "User" ("id") on delete cascade on update cascade
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(/* sql */ `
            alter table "AuthSession"
            drop constraint "FK_AuthSession_userId_User_id"
        `);
        await queryRunner.query(/* sql */ ` drop table "AuthSession" `);
    }
}
