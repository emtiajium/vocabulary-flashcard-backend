import { EntityRepository, Repository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import SearchResult from '@/common/domains/SearchResult';
import * as _ from 'lodash';

@EntityRepository(Vocabulary)
export default class VocabularyRepository extends Repository<Vocabulary> {
    async removeVocabularyById(id: string): Promise<void> {
        await this.delete({ id });
    }

    async findVocabularies(vocabularySearch: VocabularySearch): Promise<SearchResult<Vocabulary>> {
        const {
            pagination: { pageSize, pageNumber },
            cohortId,
        } = vocabularySearch;

        const currentPage = pageSize * (pageNumber - 1);

        let vocabularyQueryResult = await this.query(
            `
                SELECT vocabulary.*,
                       json_agg(definition.*)      AS definitions,
                       (COUNT(*) OVER ())::INTEGER AS "totalNumberOfVocabularies"
                FROM "Vocabulary" AS vocabulary
                         LEFT JOIN "Definition" AS definition ON vocabulary.id = definition."vocabularyId"
                WHERE vocabulary."cohortId" = $1
                GROUP BY vocabulary.id
                ORDER BY vocabulary."createdAt" DESC
                OFFSET $2 LIMIT $3;
            `,
            [cohortId, currentPage, pageSize],
        );

        vocabularyQueryResult = this.rejectNull(vocabularyQueryResult);

        return new SearchResult(vocabularyQueryResult, vocabularyQueryResult[0]?.totalNumberOfVocabularies || 0);
    }

    // eslint-disable-next-line class-methods-use-this
    rejectNull(result: Vocabulary[]): Vocabulary[] {
        // as LEFT join result[index].definitions can be [null]
        return _.map(result, (eachResult) => {
            return {
                ...eachResult,
                definitions: eachResult.definitions[0] ? eachResult.definitions : [],
            };
        });
    }

    async findVocabularyById(id: string): Promise<Vocabulary> {
        let result = await this.query(
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

        result = this.rejectNull(result);

        return result[0];
    }
}
