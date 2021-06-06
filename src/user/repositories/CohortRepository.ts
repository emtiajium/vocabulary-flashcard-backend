import { EntityRepository, Repository } from 'typeorm';
import Cohort from '@/user/domains/Cohort';

@EntityRepository(Cohort)
export default class CohortRepository extends Repository<Cohort> {
    async insertIfNotExists(cohort: Cohort): Promise<void> {
        const userIds = cohort.userIds.map((userId) => `'${userId}'`);
        await this.createQueryBuilder()
            .insert()
            .into(Cohort)
            .values({ name: () => `'${cohort.name}'::VARCHAR`, userIds: () => `ARRAY [${userIds}]::UUID[]` })
            .onConflict(`("name") DO NOTHING`)
            .printSql()
            .execute();
    }

    async getCohortByName(name: string): Promise<Cohort> {
        return this.findOneOrFail({ name });
    }

    async updateUsersToCohort(id: string, userIds: string[]): Promise<void> {
        const clonedUserIds = userIds.map((userId) => `'${userId}'`);
        await this.query(
            `
                UPDATE "Cohort"
                SET "userIds"   = ARRAY [${clonedUserIds}]::UUID[],
                    "updatedAt" = NOW(),
                    version     = "Cohort".version + 1
                WHERE id = $1::UUID;
            `,
            [id],
        );
    }
}
