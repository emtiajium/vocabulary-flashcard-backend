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

    async getRandomlyChosenMeanings(
        cohortId: string,
        userId: string,
        excludedDefinitionIds: string[],
    ): Promise<RandomlyChosenMeaningQueryResponse[]> {
        // table sampling works before applying the filtering
        // hence a temporary table to store the filtered data
        // there are not much data, so won't be a performance issue
        const tableName = `FilteredDefinition_${userId}`;
        await this.query(`drop table if exists "${tableName}";`);
        await this.query(
            `
                create temporary table "${tableName}" as (select "Definition".id as "definitionId",
                                                                 "Definition".meaning,
                                                                 "Vocabulary".word
                                                          from "Definition"
                                                                   inner join "Vocabulary"
                                                                              on "Vocabulary".id =
                                                                                 "Definition"."vocabularyId" and
                                                                                 "Vocabulary"."cohortId" = $1
                                                          where (array_length($2::uuid[], 1) is null
                                                              or "Definition".id != all ($2::uuid[])));
            `,
            [cohortId, excludedDefinitionIds],
        );
        return this.query(`
            select *
            from "${tableName}"
                     tablesample bernoulli (10)
            limit 15;
        `);
    }

    getAnyMeanings(cohortId: string, excludedDefinitionIds: string[]): Promise<RandomlyChosenMeaningQueryResponse[]> {
        return this.query(
            `
                select "Definition".id as "definitionId", "Definition".meaning, "Vocabulary".word
                from "Definition"
                         inner join "Vocabulary" on "Vocabulary".id = "Definition"."vocabularyId" and
                                                    "Vocabulary"."cohortId" = $1
                where (array_length($2::uuid[], 1) is null
                    or "Definition".id != any ($2::uuid[]))
                limit 10;
            `,
            [cohortId, excludedDefinitionIds],
        );
    }
}
