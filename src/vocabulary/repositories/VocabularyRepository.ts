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
        const result = await this.query(
            `
                SELECT vocabulary.*,
                       json_agg(definition.*) AS definitions
                FROM "Vocabulary" AS vocabulary
                         LEFT JOIN "Definition" AS definition ON vocabulary.id = definition."vocabularyId"
                WHERE vocabulary.id = $1
                GROUP BY vocabulary.id;
            `,
            [id],
        );

        if (result[0]) {
            return {
                ...result[0],
                // as LEFT join result[0].definitions can be [null]
                definitions: result[0].definitions[0] ? result[0].definitions : [],
            } as Vocabulary;
        }

        return result[0];
    }
}
