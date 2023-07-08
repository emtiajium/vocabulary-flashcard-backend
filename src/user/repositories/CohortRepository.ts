import { EntityRepository, Repository } from 'typeorm';
import Cohort from '@/user/domains/Cohort';
import EntityNotFoundException from '@/common/exceptions/EntityNotFoundException';
import { ConflictException } from '@nestjs/common';

@EntityRepository(Cohort)
export default class CohortRepository extends Repository<Cohort> {
    async insertIfNotExists(cohort: Cohort): Promise<Cohort> {
        let savedCohort: Cohort;
        try {
            const insertResult = await this.createQueryBuilder()
                .insert()
                .into(Cohort)
                .values({ name: () => `'${cohort.name}'::VARCHAR` })
                .execute();

            savedCohort = insertResult.generatedMaps[0] as Cohort;
        } catch (error) {
            if (error.constraint === 'UQ_Cohort_name') {
                throw new ConflictException(`Cohort with name "${cohort.name}" already exists`);
            }
            throw error;
        }
        return savedCohort;
    }

    async getCohortByName(name: string): Promise<Cohort> {
        // findOneOrFail() is not working as expected
        const cohort: Cohort = await this.findOne({ name });
        if (!cohort) {
            throw new EntityNotFoundException(`Cohort with name "${name}" does not exist`);
        }
        return cohort;
    }

    async findCohortById(id: string): Promise<Cohort> {
        const cohort = await this.createQueryBuilder(`cohort`)
            .where(`cohort.id = :id`, { id })
            .innerJoin(`cohort.users`, `user`)
            .orderBy(`user.firstname`)
            .select(['cohort.name'])
            .addSelect(['user.firstname', 'user.lastname', 'user.username', 'user.profilePictureUrl'])
            .getOne();
        if (!cohort) {
            throw new EntityNotFoundException(`Cohort with id "${id}" does not exist`);
        }
        return cohort;
    }

    async isCohortAlone(id: string): Promise<boolean> {
        const cohort = await this.createQueryBuilder(`cohort`)
            .where(`cohort.id = :id`, { id })
            .innerJoin(`cohort.users`, `user`)
            .select(['cohort.id'])
            .addSelect(['user.id'])
            .getOne();
        return cohort.users.length === 1;
    }

    async removeById(id: string): Promise<void> {
        await this.delete({ id });
    }
}
