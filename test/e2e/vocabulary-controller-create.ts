import { INestApplication } from '@nestjs/common';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import Meaning from '@/vocabulary/domains/Meaning';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import { getMeaningByVocabularyId, removeVocabularyAndRelationsByCohortId } from '@test/util/vocabulary-util';

describe('/v1/vocabularies', () => {
    let app: INestApplication;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await bootstrap(AppModule);
        cohort = await createCohort({ name: 'Vocabulary Automated Test Cohort', userIds: [] } as Cohort);
    });

    afterAll(async () => {
        await removeVocabularyAndRelationsByCohortId(cohort.id);
        await removeCohortByName(cohort.name);
        await app.close();
    });

    async function makeApiRequest(vocabulary?: Vocabulary): Promise<SupertestResponse<Vocabulary>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/vocabularies`)
            .send(vocabulary);
        return {
            status,
            body,
        };
    }

    function getBaseMeaningPayloadWithoutRelations(vocabularyId?: string, meaningId?: string): Meaning {
        const meaning = new Meaning();
        meaning.id = meaningId;
        meaning.vocabularyId = vocabularyId;
        meaning.meaning = 'Meaning 1';
        meaning.examples = ['Example1'];
        meaning.notes = ['Notes1'];
        meaning.externalLinks = ['https://gibberish.com/public/static/blah.html'];
        return meaning;
    }

    describe('POST /', () => {
        describe('Bad Payload', () => {
            it('SHOULD return 400 BAD_REQUEST for empty payload', async () => {
                const { status } = await makeApiRequest();
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without vocabulary', async () => {
                const payload = new Vocabulary();
                payload.isDraft = true;
                payload.cohortId = cohort.id;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without cohort', async () => {
                const payload = new Vocabulary();
                payload.isDraft = true;
                payload.cohortId = null;
                payload.vocabulary = 'Vocabulary1';
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without isDraft', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.vocabulary = 'Vocabulary1';
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without meanings', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.vocabulary = 'Vocabulary1';
                payload.meanings = null;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without meanings[X].meaning', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.vocabulary = 'Vocabulary1';
                const meaning = getBaseMeaningPayloadWithoutRelations();
                delete meaning.meaning;
                payload.meanings = [meaning];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without meanings[X].examples', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.vocabulary = 'Vocabulary1';
                const meaning = { ...getBaseMeaningPayloadWithoutRelations() } as ObjectLiteral;
                delete meaning.examples;
                payload.meanings = [meaning as Meaning];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with empty meanings[X].examples', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.vocabulary = 'Vocabulary1';
                const meaning = { ...getBaseMeaningPayloadWithoutRelations(), examples: [] };
                payload.meanings = [meaning as Meaning];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without meanings[X].vocabularyId', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.vocabulary = 'Vocabulary1';
                const meaning = { ...getBaseMeaningPayloadWithoutRelations() };
                payload.meanings = [meaning as Meaning];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with invalid meanings[X].vocabularyId', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.vocabulary = 'Vocabulary1';
                const meaning = { ...getBaseMeaningPayloadWithoutRelations('IM_AN_NOT_A_UUID') };
                payload.meanings = [meaning as Meaning];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 201 CREATED for payload WHEN meanings is an empty array', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = true;
                payload.vocabulary = 'Vocabulary1';
                payload.meanings = [];

                const { status, body } = await makeApiRequest(payload);

                expect(status).toBe(201);

                const vocabulary = body as Vocabulary;
                expect(vocabulary.meanings).toHaveLength(1);
                expect(vocabulary.meanings[0].vocabularyId).toBe(payload.id);

                const meanings = await getMeaningByVocabularyId(payload.id);
                expect(meanings).toHaveLength(1);
                expect(meanings[0].vocabularyId).toBe(payload.id);
                expect(meanings[0].id).toBe(vocabulary.meanings[0].id);
            });

            it('SHOULD return 201 CREATED with created with vocabulary', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.vocabulary = 'Vocabulary1';
                payload.meanings = [getBaseMeaningPayloadWithoutRelations(payload.id)];
                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;
                expect(status).toBe(201);
                expect(vocabulary).toBeDefined();
                expect(vocabulary.id).toBe(payload.id);
                vocabulary.meanings.forEach((meaning) => {
                    expect(meaning.vocabularyId).toBe(payload.id);
                    expect(meaning.id).toBeDefined();
                });
                expect(await getMeaningByVocabularyId(vocabulary.id)).toHaveLength(1);
            });

            it('SHOULD return 201 CREATED with same vocabulary ID', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = true;
                payload.vocabulary = 'Vocabulary1';
                payload.meanings = [];

                const { body: draftVocabulary } = await makeApiRequest(payload);
                const meaningId = (draftVocabulary as Vocabulary).meanings[0].id;
                expect(meaningId).toBeDefined();

                const draftMeanings = await getMeaningByVocabularyId(payload.id);
                expect(draftMeanings).toHaveLength(1);
                expect(draftMeanings[0].vocabularyId).toBe(payload.id);
                expect(draftMeanings[0].id).toBe(meaningId);

                // second attempt

                payload.isDraft = false;
                payload.meanings = [getBaseMeaningPayloadWithoutRelations(payload.id, meaningId)];

                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;

                expect(status).toBe(201);
                expect(vocabulary).toBeDefined();
                expect(vocabulary.id).toBe(payload.id);
                vocabulary.meanings.forEach((meaning) => {
                    expect(meaning.vocabularyId).toBe(payload.id);
                });

                const meanings = await getMeaningByVocabularyId(payload.id);

                expect(meanings).toHaveLength(1);
                expect(meanings).toHaveLength(1);
                expect(meanings[0].vocabularyId).toBe(payload.id);
                expect(meanings[0].id).toBe(meaningId);
            });
        });
    });
});
