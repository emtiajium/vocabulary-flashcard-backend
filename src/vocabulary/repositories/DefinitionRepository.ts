import { DataSource, In, Repository } from 'typeorm';
import Definition from '@/vocabulary/domains/Definition';
import { Injectable } from '@nestjs/common';
import { RandomlyChosenMeaningQueryResponse } from '@/vocabulary/domains/RandomlyChosenMeaningResponse';

@Injectable()
export default class DefinitionRepository extends Repository<Definition> {
    constructor(private dataSource: DataSource) {
        super(Definition, dataSource.createEntityManager());
    }

    async removeDefinitionsByIds(ids: string[]): Promise<void> {
        await this.delete({ id: In(ids) });
    }

    async removeDefinitionsByVocabularyId(vocabularyId: string): Promise<void> {
        await this.delete({ vocabulary: { id: vocabularyId } });
    }

    async removeDefinitionsByCohortId(cohortId: string): Promise<void> {
        await this.query(
            `DELETE
             FROM "Definition"
             WHERE "Definition"."vocabularyId" IN (SELECT id
                                                   FROM "Vocabulary"
                                                   WHERE "cohortId" = $1)`,
            [cohortId],
        );
    }

    getRandomlyChosenMeanings(
        cohortId: string,
        excludedDefinitionIds: string[],
    ): Promise<RandomlyChosenMeaningQueryResponse[]> {
        return this.query(
            `
                select "Definition".id as "definitionId", "Definition".meaning, "Vocabulary".word
                from "Definition"
                         tablesample bernoulli (10)
                         inner join "Vocabulary" on "Vocabulary".id = "Definition"."vocabularyId" and
                                                    "Vocabulary"."cohortId" = $1
                where "Definition".id != ANY ($2);
            `,
            [cohortId, excludedDefinitionIds],
        );
    }

    getAnyMeanings(cohortId: string, excludedDefinitionIds: string[]): Promise<RandomlyChosenMeaningQueryResponse[]> {
        return this.query(
            `
                select "Definition".id as "definitionId", "Definition".meaning, "Vocabulary".word
                from "Definition"
                         inner join "Vocabulary" on "Vocabulary".id = "Definition"."vocabularyId" and
                                                    "Vocabulary"."cohortId" = $1
                where "Definition".id != ANY ($2)
                limit 10;
            `,
            [cohortId, excludedDefinitionIds],
        );
    }
}
