import { DataSource, Repository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import VocabularySearchRequest from '@/vocabulary/domains/VocabularySearchRequest';
import SearchResult from '@/common/domains/SearchResult';
import Sort, { SortDirection, SupportedSortFields } from '@/common/domains/Sort';
import VocabularySearchCoverage from '@/vocabulary/domains/VocabularySearchCoverage';
import { ConflictException, Injectable } from '@nestjs/common';
import VocabularySearchResponse from '@/vocabulary/domains/VocabularySearchResponse';

@Injectable()
export default class VocabularyRepository extends Repository<Vocabulary> {
    constructor(private dataSource: DataSource) {
        super(Vocabulary, dataSource.createEntityManager());
    }

    async insertOrUpdate(vocabulary: Vocabulary): Promise<Vocabulary> {
        try {
            return await this.save(vocabulary);
        } catch (error) {
            if (error.constraint === 'UQ_Vocabulary_word_cohortId') {
                throw new ConflictException(`"${vocabulary.word}" already exists. Please update it.`);
            }
            throw error;
        }
    }

    async removeVocabularyById(id: string): Promise<void> {
        await this.delete({ id });
    }

    async removeVocabulariesByCohortId(cohortId: string): Promise<void> {
        await this.delete({ cohortId });
    }

    async findVocabularies(
        userId: string,
        cohortId: string,
        vocabularySearchRequest: VocabularySearchRequest,
    ): Promise<SearchResult<VocabularySearchResponse>> {
        const {
            pagination: { pageSize, pageNumber },
            sort,
            searchKeyword,
            vocabularySearchCoverage,
            fetchNotHavingDefinitionOnly,
            fetchFlashcard,
        } = vocabularySearchRequest;

        const sortField = Sort.getField(SupportedSortFields.updatedAt, sort);

        const currentPage = pageSize * (pageNumber - 1);

        const searchKeywordParameterPosition = 5;

        const vocabularyQueryResult = await this.query(
            `
                SELECT vocabulary.id,
                       vocabulary.word,
                       coalesce(json_agg(json_build_object('id', definition.id, 'meaning', definition.meaning))
                                filter (where definition.id is not null), '[]') AS definitions,
                       COUNT("leitnerSystems"."userId")::INTEGER::BOOLEAN       AS "isInLeitnerBox",
                       (COUNT(*) OVER ())::INTEGER                              AS "totalNumberOfVocabularies"
                FROM "Vocabulary" AS vocabulary
                         LEFT JOIN "Definition" AS definition ON vocabulary.id = definition."vocabularyId"
                         LEFT JOIN "LeitnerSystems" AS "leitnerSystems"
                                   ON vocabulary.id = "leitnerSystems"."vocabularyId" AND
                                      "leitnerSystems"."userId" = $1
                WHERE vocabulary."cohortId" = $2
                    ${this.getSearchQuery(
                        searchKeyword || '',
                        vocabularySearchCoverage,
                        searchKeywordParameterPosition,
                    )}
                    ${this.getFilteringQuery(fetchNotHavingDefinitionOnly, fetchFlashcard)}
                GROUP BY vocabulary.id, vocabulary."${sortField}"
                ORDER BY vocabulary."${sortField}" ${Sort.getDirection(SortDirection.DESC, sort)}
                OFFSET $3 LIMIT $4;
            `,
            searchKeyword
                ? [userId, cohortId, currentPage, pageSize, `%${searchKeyword.trim()}%`]
                : [userId, cohortId, currentPage, pageSize],
        );

        return SearchResult.omitTotal<VocabularySearchResponse, { totalNumberOfVocabularies: number }>(
            vocabularyQueryResult,
            'totalNumberOfVocabularies',
        );
    }

    private getSearchQuery(
        searchKeyword: string,
        // eslint-disable-next-line @typescript-eslint/default-param-last
        vocabularySearchCoverage: VocabularySearchCoverage = { word: true } as VocabularySearchCoverage,
        queryParameterPosition: number,
    ): string {
        if (searchKeyword.trim().length === 0) {
            return ``;
        }

        const searchBuilder = {
            word: `vocabulary.word ILIKE $${queryParameterPosition}`,
            linkerWords: `vocabulary."linkerWords"::TEXT ILIKE $${queryParameterPosition}`,
            genericNotes: `vocabulary."genericNotes"::TEXT ILIKE $${queryParameterPosition}`,
            meaning: `definition.meaning ILIKE $${queryParameterPosition}`,
            examples: `definition.examples::TEXT ILIKE $${queryParameterPosition}`,
            notes: `definition.notes::TEXT ILIKE $${queryParameterPosition}`,
        };

        Object.keys(searchBuilder).forEach((key) => {
            if (!vocabularySearchCoverage[key]) {
                delete searchBuilder[key];
            }
        });

        return `AND (${Object.values(searchBuilder).join(' OR ')})`;
    }

    private getFilteringQuery(fetchNotHavingDefinitionOnly: boolean, fetchFlashcard: boolean): string {
        return `${fetchNotHavingDefinitionOnly ? `AND definition IS NULL` : ''}
        ${fetchFlashcard || fetchFlashcard === undefined ? `` : `AND "leitnerSystems"."userId" IS NULL`}`;
    }

    async findVocabularyById(id: string, userId: string): Promise<Vocabulary> {
        const results = await this.query(
            `
                SELECT vocabulary.id,
                       vocabulary."cohortId",
                       vocabulary.word,
                       vocabulary."genericNotes",
                       vocabulary."genericExternalLinks",
                       vocabulary."linkerWords",
                       vocabulary."isDraft",
                       coalesce(json_agg(json_build_object('id', definition.id,
                                                           'vocabularyId', definition."vocabularyId",
                                                           'meaning', definition.meaning,
                                                           'examples', definition.examples,
                                                           'notes', definition.notes,
                                                           'externalLinks', definition."externalLinks"))
                                filter (where definition.id is not null), '[]') AS definitions,
                       CASE
                           WHEN
                               EXISTS(SELECT "leitnerSystems".id
                                      FROM "LeitnerSystems" AS "leitnerSystems"
                                      WHERE "leitnerSystems"."vocabularyId" = $1
                                        AND "leitnerSystems"."userId" = $2)
                               THEN true
                           ELSE false
                           END                                                  AS "isInLeitnerBox"
                FROM "Vocabulary" AS vocabulary
                         LEFT JOIN (SELECT *
                                    FROM "Definition"
                                    WHERE "vocabularyId" = $1
                                    ORDER BY "createdAt" ASC) AS definition
                                   ON vocabulary.id = definition."vocabularyId"
                WHERE vocabulary.id = $1
                GROUP BY vocabulary.id;
            `,
            [id, userId],
        );

        return results[0];
    }

    async getSingleVocabularyByCohortId(cohortId: string): Promise<Vocabulary> {
        const queryResult = await this.query(
            `SELECT *
             FROM "Vocabulary"
             WHERE "cohortId" = $1
             LIMIT 1;`,
            [cohortId],
        );
        return queryResult[0];
    }

    async isVocabularyExist(id: string, cohortId: string): Promise<boolean> {
        const vocabulary = await this.query(
            `SELECT EXISTS(SELECT id
                           FROM "Vocabulary"
                           WHERE id = $1
                             AND "cohortId" = $2
                        ) AS existence;`,
            [id, cohortId],
        );
        return vocabulary[0].existence;
    }

    async getPartialForRemoval(id: string): Promise<Pick<Vocabulary, 'cohortId' | 'isInLeitnerBox'>> {
        const queryResult = await this.query(
            `SELECT vocabulary."cohortId",
                    CASE
                        WHEN
                            EXISTS(SELECT "leitnerSystems".id
                                   FROM "LeitnerSystems" AS "leitnerSystems"
                                   WHERE "leitnerSystems"."vocabularyId" = $1)
                            THEN true
                        ELSE false
                        END AS "isInLeitnerBox"
             FROM "Vocabulary" AS vocabulary
             WHERE vocabulary.id = $1;`,
            [id],
        );

        return queryResult[0];
    }

    assertExistenceByWord(id: string, word: string, cohortId: string): Promise<Partial<Vocabulary> | undefined> {
        return this.createQueryBuilder('vocabulary')
            .where(`LOWER(vocabulary.word) = :word`, { word: word.toLowerCase().trim() })
            .andWhere(`vocabulary.cohortId = :cohortId`, { cohortId })
            .andWhere(`vocabulary.id != :id`, { id })
            .select(['vocabulary.id', 'vocabulary.word'])
            .getOne();
    }

    async getIdByWord(word: string, cohortId: string): Promise<string | undefined> {
        const vocabulary = await this.createQueryBuilder('vocabulary')
            .where(`LOWER(vocabulary.word) = :word`, { word: word.toLowerCase().trim() })
            .andWhere(`vocabulary.cohortId = :cohortId`, { cohortId })
            .select(['vocabulary.id'])
            .getOne();
        return vocabulary?.id;
    }

    getLinkerWordsByWords(words: string[], cohortId: string): Promise<Pick<Vocabulary, 'id' | 'linkerWords'>[]> {
        return this.createQueryBuilder('vocabulary')
            .where(`LOWER(vocabulary.word) IN (:...words)`, { words: words.map((word) => word.toLowerCase().trim()) })
            .andWhere(`vocabulary.cohortId = :cohortId`, { cohortId })
            .select(['vocabulary.id', 'vocabulary.linkerWords'])
            .getMany();
    }

    async getIdsByCohortId(cohortId: string): Promise<string[]> {
        const vocabularies = await this.createQueryBuilder('vocabulary')
            .where(`vocabulary.cohortId = :cohortId`, { cohortId })
            .select(['vocabulary.id'])
            .getMany();

        return vocabularies.map((vocabulary) => vocabulary.id);
    }

    async updateCohortId(id: string, cohortId: string): Promise<void> {
        await this.update(id, { cohortId }).catch((error) => {
            if (error.constraint === 'UQ_Vocabulary_word_cohortId') {
                const word = error.detail.split(`, ${cohortId}`)[0].split(`Key (word, "cohortId")=(`)[1];
                throw new ConflictException({
                    word,
                    name: `WordConflict`,
                    message: `"${word}" already exists.`,
                });
            }
            throw error;
        });
    }

    async updateWord(id: string, word: string): Promise<void> {
        await this.update(id, { word });
    }

    async updateLinkerWords(id: string, linkerWords: string[]): Promise<void> {
        await this.update(id, { linkerWords });
    }
}
