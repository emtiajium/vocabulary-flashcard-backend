import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import Definition from '@/vocabulary/domains/Definition';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import {
    createVocabulary,
    getDefinitionsByVocabularyId,
    getVocabularyById,
    getVocabularyWithDefinitions,
} from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester } from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import { createItem } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import * as _ from 'lodash';
import { delay } from '@/common/utils/moment-util';

describe('/v1/vocabularies', () => {
    let app: INestApplication;

    let requester: User;

    let secondUser: User;

    let cohort: Cohort;

    const cohortIds: string[] = [];

    async function seed(): Promise<{ user: User; cohort: Cohort }> {
        const user = await createApiRequester();
        const createdCohort = await createCohort({
            name: `Cohort _ ${uuidV4()}`,
            usernames: [user.username],
        } as Cohort);
        cohortIds.push(createdCohort.id);
        user.cohort = { id: createdCohort.id } as Cohort;
        return {
            user,
            cohort: createdCohort,
        };
    }

    beforeAll(async () => {
        app = await kickOff(AppModule);

        const response = await seed();
        requester = response.user;
        cohort = response.cohort;
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds(cohortIds);
        await app.close();
    });

    async function makeApiRequest(
        vocabulary?: Vocabulary,
        user: User = requester,
    ): Promise<SupertestResponse<Vocabulary>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/vocabularies`)
            .set('Authorization', `Bearer ${generateJwToken(user)}`)
            .send(vocabulary);
        return {
            status,
            body,
        };
    }

    function getBaseDefinitionPayloadWithoutRelations(
        vocabularyId?: string,
        definitionId: string = uuidV4(),
    ): Definition {
        const definition = new Definition();
        definition.id = definitionId;
        definition.vocabularyId = vocabularyId;
        definition.meaning = 'Meaning 1';
        definition.examples = ['Example1'];
        definition.notes = ['Notes1'];
        definition.externalLinks = ['https://firecrackervocabulary.com/public/static/blah.html'];
        return definition;
    }

    describe('POST /', () => {
        describe('UnAuthorized', () => {
            it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
                const { status } = await request(app.getHttpServer())
                    .post(`${getAppAPIPrefix()}/v1/vocabularies`)
                    .send();
                expect(status).toBe(403);
            });
        });

        describe('Bad Payload', () => {
            it('SHOULD return 400 BAD_REQUEST for empty payload', async () => {
                const { status } = await makeApiRequest(new Vocabulary());
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without id', async () => {
                const payload = new Vocabulary();
                payload.word = `Word_${uuidV4()}`;
                payload.isDraft = true;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without word', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without isDraft', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.word = `Word_${uuidV4()}`;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = null;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with empty definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for empty definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [
                    getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()),
                    { ...getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()), meaning: 'Meaning 2' },
                ];

                await makeApiRequest(payload);

                // second attempt
                payload.definitions = [];

                const { status } = await makeApiRequest(payload);

                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload vocabulary.genericExternalLinks is not an array', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                payload.genericExternalLinks = 'NOT_AN_ARRAY';
                payload.definitions = [];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload vocabulary.genericExternalLinks does not contain URL', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                payload.genericExternalLinks = ['NOT_AN_URL'];
                payload.definitions = [];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions[X].vocabularyId', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = { ...getBaseDefinitionPayloadWithoutRelations() };
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with invalid definitions[X].vocabularyId', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = { ...getBaseDefinitionPayloadWithoutRelations('NOT_A_UUID') };
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions[X].id', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = { ...getBaseDefinitionPayloadWithoutRelations(payload.id) };
                delete definition.id;
                payload.definitions = [definition as Definition];
                const { status, body } = await makeApiRequest(payload);
                expect(status).toBe(400);
                expect(
                    (body as SupertestErrorResponse).message.includes(
                        `definitions.0.id should not be null or undefined`,
                    ),
                ).toBe(true);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with invalid definitions[X].id', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = { ...getBaseDefinitionPayloadWithoutRelations(payload.id) };
                definition.id = 'NOT_A_UUID';
                payload.definitions = [definition as Definition];
                const { status, body } = await makeApiRequest(payload);
                expect(status).toBe(400);
                expect((body as SupertestErrorResponse).message.includes(`definitions.0.id must be a UUID`)).toBe(true);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions[X].meaning', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = getBaseDefinitionPayloadWithoutRelations(payload.id);
                delete definition.meaning;
                payload.definitions = [definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload definitions[X].externalLinks is not an array', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = {
                    ...getBaseDefinitionPayloadWithoutRelations(payload.id),
                    externalLinks: 'NOT_AN_ARRAY',
                };
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                payload.definitions = [definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload definitions[X].externalLinks does not contain URL', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = getBaseDefinitionPayloadWithoutRelations(payload.id);
                definition.externalLinks.push('NOT_AN_URL');
                payload.definitions = [definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without definitions[X].examples', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = { ...getBaseDefinitionPayloadWithoutRelations(payload.id) } as ObjectLiteral;
                delete definition.examples;
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with empty definitions[X].examples', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = { ...getBaseDefinitionPayloadWithoutRelations(payload.id), examples: [] };
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload WHEN definitions[X].examples contains empty string', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                const definition = { ...getBaseDefinitionPayloadWithoutRelations(payload.id), examples: [''] };
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST and validate definition even if isDraft = true', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                const definition = getBaseDefinitionPayloadWithoutRelations(payload.id);
                delete definition.meaning;
                payload.definitions = [definition as Definition];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });
        });

        describe('Valid Payload', () => {
            it('SHOULD return 201 CREATED AND omit cohort ID as the API response', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word _ ${uuidV4()}`;
                payload.definitions = [];

                const { status, body } = await makeApiRequest(payload);

                expect(status).toBe(201);

                const vocabulary = body as Vocabulary;
                expect(vocabulary.cohortId).toBeUndefined();
                expect(vocabulary.cohort).toBeUndefined();
            });

            it('SHOULD return 201 CREATED with trimmed word', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = ` Word _ ${uuidV4()} `;
                payload.definitions = [];

                const { status, body } = await makeApiRequest(payload);

                expect(status).toBe(201);

                const vocabulary = body as Vocabulary;
                expect(vocabulary.word).toBe(payload.word.trim());
            });

            it('SHOULD return 201 CREATED with capitalized word', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `lower cased word _ ${uuidV4()}`;
                payload.definitions = [];

                const { status, body } = await makeApiRequest(payload);

                expect(status).toBe(201);

                const vocabulary = body as Vocabulary;
                expect(vocabulary.word).toBe(_.capitalize(payload.word));
            });

            it('SHOULD return 201 CREATED with capitalized linker words', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = 'word';
                payload.definitions = [];
                payload.linkerWords = ['lower 1', 'lower 2'];

                const { status, body } = await makeApiRequest(payload);

                expect(status).toBe(201);

                const vocabulary = body as Vocabulary;
                expect(vocabulary.linkerWords[0]).toBe(_.capitalize('Lower 1'));
                expect(vocabulary.linkerWords[1]).toBe(_.capitalize('Lower 2'));
            });

            it('SHOULD return 201 CREATED for payload WHEN definitions[x].externalLinks is not defined', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [getBaseDefinitionPayloadWithoutRelations(payload.id)];
                delete payload.definitions[0].externalLinks;

                const { status } = await makeApiRequest(payload);

                expect(status).toBe(201);
            });

            it('SHOULD return 201 CREATED for payload WHEN vocabulary.genericExternalLinks is not defined', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [];
                delete payload.genericExternalLinks;

                const { status } = await makeApiRequest(payload);

                expect(status).toBe(201);
            });

            it('SHOULD return 201 CREATED for payload WHEN definitions is an empty array', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [];

                const { status, body } = await makeApiRequest(payload);

                expect(status).toBe(201);

                const vocabulary = body as Vocabulary;
                expect(vocabulary.definitions).toHaveLength(0);

                const definitions = await getDefinitionsByVocabularyId(payload.id);
                expect(definitions).toHaveLength(0);
            });

            it('SHOULD return 201 CREATED with created vocabulary', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
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
                expect(await getDefinitionsByVocabularyId(vocabulary.id)).toHaveLength(1);
            });

            it('SHOULD return 201 CREATED with same vocabulary ID WHEN definition is defined later', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [];

                const { body } = await makeApiRequest(payload);
                const draftVocabulary = body as Vocabulary;
                expect(draftVocabulary).toBeDefined();
                expect(draftVocabulary.id).toBe(payload.id);

                const draftDefinitions = await getDefinitionsByVocabularyId(payload.id);
                expect(draftDefinitions).toHaveLength(0);

                // second attempt

                payload.definitions = [getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4())];

                const { status, body: body2 } = await makeApiRequest(payload);
                const vocabulary = body2 as Vocabulary;

                expect(status).toBe(201);
                expect(vocabulary).toBeDefined();
                expect(vocabulary.id).toBe(payload.id);
                expect(vocabulary.version).toBe(2);
                expect(vocabulary.updatedAt).not.toBe(draftVocabulary.updatedAt);
                expect(vocabulary.updatedAt).not.toBe(vocabulary.createdAt);
                expect(vocabulary.definitions).toHaveLength(1);
                expect(vocabulary.definitions[0].vocabularyId).toBe(payload.id);
                expect(vocabulary.isDraft).toBe(false);

                const definitions = await getDefinitionsByVocabularyId(payload.id);

                expect(definitions).toHaveLength(1);
                expect(definitions).toHaveLength(1);
                expect(definitions[0].vocabularyId).toBe(payload.id);
                expect(definitions[0].id).toBeDefined();
            });

            it('SHOULD return 201 CREATED with same vocabulary ID', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [getBaseDefinitionPayloadWithoutRelations(payload.id)];

                const { body: draftVocabulary } = await makeApiRequest(payload);
                const definitionId = (draftVocabulary as Vocabulary).definitions[0].id;
                expect(definitionId).toBeDefined();

                const draftDefinitions = await getDefinitionsByVocabularyId(payload.id);
                expect(draftDefinitions).toHaveLength(1);
                expect(draftDefinitions[0].vocabularyId).toBe(payload.id);
                expect(draftDefinitions[0].id).toBe(definitionId);

                // second attempt

                // update definition
                payload.definitions = [
                    {
                        ...getBaseDefinitionPayloadWithoutRelations(payload.id, definitionId),
                        meaning: 'Updated meaning',
                        examples: ['Updated example'],
                    },
                ];

                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;

                expect(status).toBe(201);
                expect(vocabulary).toBeDefined();
                expect(vocabulary.id).toBe(payload.id);
                expect(vocabulary.definitions).toHaveLength(1);
                expect(vocabulary.definitions[0].vocabularyId).toBe(payload.id);
                expect(vocabulary.definitions[0].meaning).toBe(payload.definitions[0].meaning);
                expect(vocabulary.definitions[0].examples).toHaveLength(1);
                expect(vocabulary.definitions[0].examples[0]).toBe(payload.definitions[0].examples[0]);

                const definitions = await getDefinitionsByVocabularyId(payload.id);

                expect(definitions).toHaveLength(1);
                expect(definitions[0].vocabularyId).toBe(payload.id);
                expect(definitions[0].id).toBe(definitionId);
                expect(definitions[0].id).toBe(payload.definitions[0].id);
            });

            it('SHOULD return 201 CREATED with same vocabulary ID WHEN a definition is added later', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [getBaseDefinitionPayloadWithoutRelations(payload.id)];

                const { body: draftVocabulary } = await makeApiRequest(payload);
                const definitionId = (draftVocabulary as Vocabulary).definitions[0].id;
                expect(definitionId).toBeDefined();

                const draftDefinitions = await getDefinitionsByVocabularyId(payload.id);
                expect(draftDefinitions).toHaveLength(1);
                expect(draftDefinitions[0].vocabularyId).toBe(payload.id);
                expect(draftDefinitions[0].id).toBe(definitionId);

                // second attempt

                payload.definitions = [
                    // existing definition
                    draftDefinitions[0],
                    // different definition
                    {
                        ...getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()),
                        meaning: 'Another meaning',
                        examples: ['example'],
                    },
                ];

                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;

                expect(status).toBe(201);
                expect(vocabulary).toBeDefined();
                expect(vocabulary.id).toBe(payload.id);
                expect(vocabulary.definitions).toHaveLength(2);
                vocabulary.definitions.forEach((definition, index) => {
                    expect(definition.id).toBe(payload.definitions[index].id);
                    expect(definition.vocabularyId).toBe(payload.id);
                    expect(definition.meaning).toBe(payload.definitions[index].meaning);
                    expect(definition.examples).toHaveLength(1);
                    expect(definition.examples[0]).toBe(payload.definitions[index].examples[0]);
                });

                const definitions = await getDefinitionsByVocabularyId(payload.id);

                expect(definitions).toHaveLength(2);
                definitions.forEach((definition, index) => {
                    expect(definition.vocabularyId).toBe(payload.id);
                    expect(definition.id).toBe(payload.definitions[index].id);
                });
            });

            it('SHOULD return 201 CREATED for the payload with multiple definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
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

                const definitions = await getDefinitionsByVocabularyId(vocabulary.id);

                expect(definitions).toHaveLength(2);
                definitions.forEach((definition, index) => {
                    expect(definition.vocabularyId).toBe(payload.id);
                    expect(definition.id).toBe(payload.definitions[index].id);
                    expect(definition.id).toBe(vocabulary.definitions[index].id);
                });
            });

            it('SHOULD return 201 CREATED with modified number of definitions | without one of the previously added definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [
                    getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()),
                    { ...getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()), meaning: 'Meaning 2' },
                ];

                await makeApiRequest(payload);

                const existingDefinitions = await getDefinitionsByVocabularyId(payload.id);

                // second attempt

                payload.definitions = [{ ...existingDefinitions[0], examples: ['Aug 8, 2021'] }];

                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;

                expect(status).toBe(201);
                expect(vocabulary.definitions).toHaveLength(1);
                expect(vocabulary.definitions[0].id).toBe(payload.definitions[0].id);
            });

            it('SHOULD return 201 CREATED with empty definitions', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = false;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [
                    getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()),
                    { ...getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4()), meaning: 'Meaning 2' },
                ];

                await makeApiRequest(payload);

                // second attempt
                payload.definitions = [];
                payload.isDraft = true;

                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;

                expect(status).toBe(201);
                expect(vocabulary.definitions).toHaveLength(0);
            });

            it('SHOULD return 403 FORBIDDEN WHEN an intruder tries to update', async () => {
                // Arrange
                const response = await seed();
                secondUser = response.user;

                let vocabulary = getVocabularyWithDefinitions();
                vocabulary = await createVocabulary(vocabulary, cohort.id);

                const payload = {
                    ...vocabulary,
                    word: 'New word',
                    definitions: [{ ...vocabulary.definitions[0], meaning: 'New definition' }],
                };

                // Act
                const { status } = await makeApiRequest(payload, secondUser);

                // Assert
                expect(status).toBe(403);
                vocabulary = await getVocabularyById(vocabulary.id);
                expect(vocabulary.version).toBe(1);
                expect(vocabulary.definitions[0].version).toBe(1);
                expect(vocabulary.word).not.toBe(payload.word);
                expect(vocabulary.definitions[0].meaning).not.toBe(payload.definitions[0].meaning);
            });

            it('SHOULD return 409 CONFLICT WHEN word already exist in same cohort', async () => {
                // Arrange
                let payload = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

                payload = {
                    ...getVocabularyWithDefinitions(),
                    word: payload.word,
                    id: uuidV4(),
                };

                // Act
                const { status, body } = await makeApiRequest(payload);

                // Assert
                expect(status).toBe(409);

                expect((body as SupertestErrorResponse).message).toBe(
                    `"${payload.word}" already exists. Please update it.`,
                );
            });

            it('SHOULD return 201 CREATED WHEN word exist in a different cohort', async () => {
                // Arrange
                const response = await seed();
                secondUser = response.user;

                let payload = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

                payload = {
                    ...getVocabularyWithDefinitions(),
                    word: payload.word,
                    id: uuidV4(),
                };

                // Act
                const { status } = await makeApiRequest(payload, secondUser);

                // Assert
                expect(status).toBe(201);
            });
        });

        describe('Leitner Box', () => {
            it('SHOULD return 201 CREATED with falsy isInLeitnerBox', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [];

                const { status, body } = await makeApiRequest(payload);

                expect(status).toBe(201);

                const vocabulary = body as Vocabulary;
                expect(vocabulary.isInLeitnerBox).toBe(false);
            });

            it('SHOULD return 201 CREATED with truthy isInLeitnerBox', async () => {
                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [];

                await makeApiRequest(payload);
                await createItem(requester.id, payload.id, LeitnerBoxType.BOX_1);

                // second attempt

                payload.isDraft = false;
                payload.definitions = [getBaseDefinitionPayloadWithoutRelations(payload.id, uuidV4())];

                const { status, body } = await makeApiRequest(payload);
                const vocabulary = body as Vocabulary;

                expect(status).toBe(201);
                expect(vocabulary.isInLeitnerBox).toBe(true);
            });
        });

        describe('Automate linker words relationship', () => {
            it("SHOULD append a newly added word as the linker word in the existing vocab WHEN the going-to-be-created vocabulary's linker word exists as a word", async () => {
                // Arrange
                const vocabulary = await createVocabulary({ ...getVocabularyWithDefinitions() }, cohort.id);

                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = `Word_${uuidV4()}`;
                payload.definitions = [];
                payload.linkerWords = [vocabulary.word];

                // Act
                await makeApiRequest(payload);
                await delay(1);

                // Assert
                const { linkerWords, version, updatedAt } = await getVocabularyById(vocabulary.id);
                expect(linkerWords).toHaveLength(1);
                expect(linkerWords).toContain(payload.word);
                expect(version).toBe(vocabulary.version + 1);
                expect(updatedAt.toISOString()).not.toBe(vocabulary.updatedAt.toISOString());
            });

            it("SHOULD ignore appending a newly added word as the linker word in the existing vocab WHEN the going-to-be-created vocabulary's word exists as a linker word", async () => {
                // Arrange
                const word = `Word_${uuidV4()}`;
                const vocabulary = await createVocabulary(
                    { ...getVocabularyWithDefinitions(), linkerWords: [`LinkerWord_${uuidV4()}`, word] },
                    cohort.id,
                );

                const payload = new Vocabulary();
                payload.id = uuidV4();
                payload.isDraft = true;
                payload.word = word;
                payload.definitions = [];
                payload.linkerWords = [vocabulary.word];

                // Act
                await makeApiRequest(payload);
                await delay(1);

                // Assert
                const { linkerWords, version, updatedAt } = await getVocabularyById(vocabulary.id);
                expect(linkerWords).toHaveLength(2);
                expect(version).toBe(vocabulary.version);
                expect(updatedAt.toISOString()).toBe(vocabulary.updatedAt.toISOString());
            });
        });
    });
});
