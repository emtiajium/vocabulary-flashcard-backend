import { Repository } from 'typeorm';
import Cohort from '@/user/domains/Cohort';

export default class CohortRepository extends Repository<Cohort> {
    // eslint-disable-next-line class-methods-use-this
    async insertIfNotExists(name: string): Promise<void> {
        await Promise.resolve();
    }
}
