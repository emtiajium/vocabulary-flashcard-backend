import { EntityRepository, Repository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import VocabularySearchQueryBuilder from '@/vocabulary/repositories/VocabularySearchQueryBuilder';
import SearchResult from '@/common/domains/SearchResult';

@EntityRepository(Vocabulary)
export default class VocabularyRepository extends Repository<Vocabulary> {
    async removeVocabularyById(id: string): Promise<void> {
        await this.delete({ id });
    }

    async findVocabularies(vocabularySearch: VocabularySearch): Promise<SearchResult<Vocabulary>> {
        const searchQueryBuilder = new VocabularySearchQueryBuilder(vocabularySearch);
        const vocabularyQuery = searchQueryBuilder.build(this.createQueryBuilder());
        const [vocabularyQueryResult, totalNumberOfVocabularies] = await vocabularyQuery.getManyAndCount();
        return new SearchResult(vocabularyQueryResult, totalNumberOfVocabularies);
    }

    async findVocabularyById(id: string): Promise<Vocabulary> {
        return this.findOne({ id });
    }
}
