import { DataSource, In, Repository } from 'typeorm';
import Definition from '@/vocabulary/domains/Definition';
import { Injectable } from '@nestjs/common';

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
}
