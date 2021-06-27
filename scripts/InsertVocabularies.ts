import * as _ from 'lodash';
import { v4 as uuidV4 } from 'uuid';
import { validateOrReject } from 'class-validator';
import { createConnection, getRepository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import { ConfigService } from '@nestjs/config';
import VocabularyList from './VocabularyList';

export default class InsertVocabularies {
    private cohortId: string;

    private vocabularies: Vocabulary[];

    async execute(): Promise<void> {
        try {
            this.setCohortId(new ConfigService().get<string>('SEED_SCRIPT_COHORT_ID'));
            this.generateVocabularyPayload();
            await validateOrReject(this.vocabularies);
            await createConnection();
            await this.remove();
            await this.persist();
        } catch (error) {
            console.log(`Error while inserting vocabularies`, error);
        }
    }

    private setCohortId(cohortId: string): void {
        this.cohortId = cohortId;
    }

    static getNewId(): string {
        return uuidV4();
    }

    private generateVocabularyPayload(): void {
        const existingVocabularies = _.cloneDeep(VocabularyList);
        this.vocabularies = _.map(existingVocabularies, (vocabulary) => {
            const vocabularyId = InsertVocabularies.getNewId();
            return {
                ...vocabulary,
                id: vocabularyId,
                cohortId: this.cohortId,
                definitions: _.map(vocabulary.definitions, (definition) => {
                    return {
                        ...definition,
                        id: InsertVocabularies.getNewId(),
                        vocabularyId,
                    } as Definition;
                }),
            } as Vocabulary;
        });
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
                vocabularyInstance.cohortId = this.cohortId;
                vocabularyInstance.isDraft = false;
                return getRepository(Vocabulary).save(vocabularyInstance);
            }),
        );
    }
}
