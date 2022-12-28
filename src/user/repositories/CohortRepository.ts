import { EntityRepository, Repository } from 'typeorm';
import Cohort from '@/user/domains/Cohort';
import EntityNotFoundException from '@/common/exceptions/EntityNotFoundException';
import { ConflictException } from '@nestjs/common';

@EntityRepository(Cohort)
export default class CohortRepository extends Repository<Cohort> {
    async insertIfNotExists(cohort: Cohort): Promise<void> {
        try {
            await this.createQueryBuilder()
                .insert()
                .into(Cohort)
                .values({ name: () => `'${cohort.name}'::VARCHAR` })
                .execute();
        } catch (error) {
            if (error.constraint === 'UQ_Cohort_name') {
                throw new ConflictException(`Cohort with name "${cohort.name}" already exists`);
            }
            throw error;
        }
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
}
