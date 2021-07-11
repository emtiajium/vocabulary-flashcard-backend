import * as _ from 'lodash';
import { validateOrReject } from 'class-validator';
import { createConnection, getConnectionManager, getRepository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import { ConfigService } from '@nestjs/config';
import { createVocabularies } from '@/vocabulary/domains/PartialVocabulary';
import vocabularyList from './vocabulary-list';

export default class InsertVocabularies {
    private cohortId: string;

    private vocabularies: Vocabulary[];

    async execute(): Promise<void> {
        try {
            this.setCohortId(new ConfigService().get<string>('SEED_SCRIPT_COHORT_ID'));
            this.generateVocabularyPayload();
            await validateOrReject(this.vocabularies);
            // TODO remove the condition
            // workaround as couldn't find a way to execute the script in a separate thread in AEB
            if (!getConnectionManager().has('default')) {
                await createConnection();
            }
            await this.remove();
            await this.persist();
        } catch (error) {
            console.log(`Error while inserting vocabularies`, error);
        }
    }

    private setCohortId(cohortId: string): void {
        this.cohortId = cohortId;
    }

    private generateVocabularyPayload(): void {
        this.vocabularies = createVocabularies(this.cohortId, vocabularyList);
    }

    private async remove(): Promise<void> {
        await getRepository(Definition).query(
            `DELETE
             FROM "Definition"
             WHERE "vocabularyId" IN (
                 SELECT id
                 FROM "Vocabulary"
                 WHERE "cohortId" = $1
             );`,
            [this.cohortId],
        );
        await getRepository(Vocabulary).delete({ cohortId: this.cohortId });
    }

    private async persist(): Promise<void> {
        await Promise.all(
            _.map(this.vocabularies, (vocabulary) => {
                const vocabularyInstance = Vocabulary.populateMeanings(vocabulary);
                return getRepository(Vocabulary).save(vocabularyInstance);
            }),
        );
    }
}
