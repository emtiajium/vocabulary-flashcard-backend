import { EntityRepository, In, Repository } from 'typeorm';
import Definition from '@/vocabulary/domains/Definition';

@EntityRepository(Definition)
export default class DefinitionRepository extends Repository<Definition> {
    async removeDefinitionsByIds(ids: string[]): Promise<void> {
        await this.delete({ id: In(ids) });
    }

    async removeDefinitionsByVocabularyId(vocabularyId: string): Promise<void> {
        await this.delete({ vocabulary: { id: vocabularyId } });
    }
}
