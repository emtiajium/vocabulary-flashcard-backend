import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthSession1793530743224 implements MigrationInterface {
    name = 'AuthSession1793530743224';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "AuthSession" (
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "version" integer NOT NULL DEFAULT '1',
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "username" text NOT NULL,
                "refreshTokenHash" text NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revokedAt" TIMESTAMP WITH TIME ZONE,
                "lastUsedAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_AuthSession_refreshTokenHash" UNIQUE ("refreshTokenHash"),
                CONSTRAINT "PK_AuthSession_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "AuthSession"
            ADD CONSTRAINT "FK_AuthSession_userId_User_id" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE 
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "AuthSession" DROP CONSTRAINT "FK_AuthSession_userId_User_id"
        `);
        await queryRunner.query(`
            DROP TABLE "AuthSession"
        `);
    }
}
