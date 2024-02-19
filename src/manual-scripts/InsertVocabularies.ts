import * as _ from 'lodash';
import { validateOrReject } from 'class-validator';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import { ConfigService } from '@nestjs/config';
import { createVocabularies } from '@/vocabulary/domains/PartialVocabulary';
import vocabularyList from './vocabulary-list';
import DataSource from '@/common/persistence/TypeormConfig';

export default class InsertVocabularies {
    private cohortId: string;

    private vocabularies: Vocabulary[];

    async execute(): Promise<void> {
        try {
            this.setCohortId(new ConfigService().get<string>('SEED_SCRIPT_COHORT_ID'));
            this.generateVocabularyPayload();
            await validateOrReject(this.vocabularies);
            if (!DataSource.isInitialized) {
                await DataSource.initialize();
            }
            await this.remove();
            await this.persist();
        } catch (error) {
            console.error(`Error while inserting vocabularies`, error);
        }
    }

    private setCohortId(cohortId: string): void {
        this.cohortId = cohortId;
    }

    private generateVocabularyPayload(): void {
        this.vocabularies = createVocabularies(this.cohortId, vocabularyList);
    }

    private async remove(): Promise<void> {
        await DataSource.getRepository(Definition).query(
            `DELETE
             FROM "Definition"
             WHERE "vocabularyId" IN (
                 SELECT id
                 FROM "Vocabulary"
                 WHERE "cohortId" = $1
             );`,
            [this.cohortId],
        );
        await DataSource.getRepository(Vocabulary).delete({ cohortId: this.cohortId });
    }

    private async persist(): Promise<void> {
        await Promise.all(
            _.map(this.vocabularies, (vocabulary) => {
                const vocabularyInstance = Vocabulary.populateDefinitions(vocabulary);
                return DataSource.getRepository(Vocabulary).save(vocabularyInstance);
            }),
        );
    }
}
