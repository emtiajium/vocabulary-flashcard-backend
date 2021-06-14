import { EntityRepository, Repository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

@EntityRepository(Vocabulary)
export default class VocabularyRepository extends Repository<Vocabulary> {
    async removeVocabularyById(id: string): Promise<void> {
        await this.delete({ id });
    }
}
