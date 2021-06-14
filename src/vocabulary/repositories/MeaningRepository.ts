import { EntityRepository, In, Repository } from 'typeorm';
import Meaning from '@/vocabulary/domains/Meaning';

@EntityRepository(Meaning)
export default class MeaningRepository extends Repository<Meaning> {
    async removeMeaningsByIds(ids: string[]): Promise<void> {
        await this.delete({ id: In(ids) });
    }
}
