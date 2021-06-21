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
import Definition from '@/vocabulary/domains/Definition';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import { getDefinitionByVocabularyId, removeVocabularyAndRelationsByCohortId } from '@test/util/vocabulary-util';

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

    function getBaseDefinitionPayloadWithoutRelations(vocabularyId?: string, definitionId?: string): Definition {
        const definition = new Definition();
        definition.id = definitionId;
        definition.vocabularyId = vocabularyId;
        definition.meaning = 'Meaning 1';
        definition.examples = ['Example1'];
        definition.notes = ['Notes1'];
        definition.externalLinks = ['https://gibberish.com/public/static/blah.html'];
        return definition;
    }

    describe('POST /', () => {
        describe('Bad Payload', () => {
            it('SHOULD return 400 BAD_REQUEST for empty payload', async () => {
                const { status } = await makeApiRequest();
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without id', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.word = 'Word1';
                payload.isDraft = true;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without word', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = true;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without cohortId', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.cohortId = null;
                payload.word = 'Word1';
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload for invalid type of cohortId', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.cohortId = 'NOT_A_UUID';
                payload.word = 'Word1';
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without isDraft', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.word = 'Word1';
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                payload.definitions = null;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with empty definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                payload.definitions = [];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions[X].vocabularyId', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                const definition = { ...getBaseDefinitionPayloadWithoutRelations() };
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with invalid definitions[X].vocabularyId', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                const definition = { ...getBaseDefinitionPayloadWithoutRelations('NOT_A_UUID') };
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions[X].meaning', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                const definition = getBaseDefinitionPayloadWithoutRelations(payload.id);
                delete definition.meaning;
                payload.definitions = [definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions[X].examples', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                const definition = { ...getBaseDefinitionPayloadWithoutRelations(payload.id) } as ObjectLiteral;
                delete definition.examples;
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with empty definitions[X].examples', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                const definition = { ...getBaseDefinitionPayloadWithoutRelations(payload.id), examples: [] };
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 201 CREATED for payload WHEN definitions is an empty array', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = true;
                payload.word = 'Word1';
                payload.definitions = [];

                const { status, body } = await makeApiRequest(payload);

                expect(status).toBe(201);

                const vocabulary = body as Vocabulary;
                expect(vocabulary.definitions).toHaveLength(1);
                expect(vocabulary.definitions[0].vocabularyId).toBe(payload.id);

                const definitions = await getDefinitionByVocabularyId(payload.id);
                expect(definitions).toHaveLength(1);
                expect(definitions[0].vocabularyId).toBe(payload.id);
                expect(definitions[0].id).toBe(vocabulary.definitions[0].id);
            });

            it('SHOULD return 201 CREATED with created vocabulary', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                payload.definitions = [getBaseDefinitionPayloadWithoutRelations(payload.id)];
                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;
                expect(status).toBe(201);
                expect(vocabulary).toBeDefined();
                expect(vocabulary.id).toBe(payload.id);
                vocabulary.definitions.forEach((definition) => {
                    expect(definition.vocabularyId).toBe(payload.id);
                    expect(definition.id).toBeDefined();
                });
                expect(await getDefinitionByVocabularyId(vocabulary.id)).toHaveLength(1);
            });

            it('SHOULD return 201 CREATED with same vocabulary ID', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = true;
                payload.word = 'Word1';
                payload.definitions = [];

                const { body: draftVocabulary } = await makeApiRequest(payload);
                const definitionId = (draftVocabulary as Vocabulary).definitions[0].id;
                expect(definitionId).toBeDefined();

                const draftMeanings = await getDefinitionByVocabularyId(payload.id);
                expect(draftMeanings).toHaveLength(1);
                expect(draftMeanings[0].vocabularyId).toBe(payload.id);
                expect(draftMeanings[0].id).toBe(definitionId);

                // second attempt

                payload.isDraft = false;
                payload.definitions = [getBaseDefinitionPayloadWithoutRelations(payload.id, definitionId)];

                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;

                expect(status).toBe(201);
                expect(vocabulary).toBeDefined();
                expect(vocabulary.id).toBe(payload.id);
                vocabulary.definitions.forEach((definition) => {
                    expect(definition.vocabularyId).toBe(payload.id);
                });

                const definitions = await getDefinitionByVocabularyId(payload.id);

                expect(definitions).toHaveLength(1);
                expect(definitions).toHaveLength(1);
                expect(definitions[0].vocabularyId).toBe(payload.id);
                expect(definitions[0].id).toBe(definitionId);
            });

            it('SHOULD return 201 CREATED for the payload with multiple definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.word = 'Word1';
                payload.definitions = [
                    getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()),
                    getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()),
                ];
                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;
                expect(status).toBe(201);
                expect(vocabulary).toBeDefined();
                expect(vocabulary.id).toBe(payload.id);
                expect(vocabulary.definitions).toHaveLength(2);

                const definitions = await getDefinitionByVocabularyId(vocabulary.id);

                expect(definitions).toHaveLength(2);
                definitions.forEach((definition, index) => {
                    expect(definition.vocabularyId).toBe(payload.id);
                    expect(definition.id).toBe(payload.definitions[index].id);
                    expect(definition.id).toBe(vocabulary.definitions[index].id);
                });
            });
        });
    });
});
