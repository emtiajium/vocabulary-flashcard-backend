import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester, createUser, generateUsername } from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import { createItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import SearchResult from '@/common/domains/SearchResult';
import { SortDirection, SupportedSortFields } from '@/common/domains/Sort';
import VocabularySearchRequest from '@/vocabulary/domains/VocabularySearchRequest';
import Definition from '@/vocabulary/domains/Definition';
import VocabularySearchResponse from '@/vocabulary/domains/VocabularySearchResponse';

describe('POST /v1/vocabularies/search', () => {
    let app: INestApplication;

    let requester: User;

    let secondUser: User;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        secondUser = await createUser({
            username: generateUsername(),
            firstname: 'Friend',
        } as User);
        cohort = await createCohort({
            name: `Cohort _ ${uuid.v4()}`,
            usernames: [requester.username, secondUser.username],
        } as Cohort);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.close();
    });

    async function makeApiRequest(
        user: User = requester,
        payload: VocabularySearchRequest = { pagination: { pageSize: 5, pageNumber: 1 } } as VocabularySearchRequest,
    ): Promise<SupertestResponse<SearchResult<VocabularySearchResponse>>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/vocabularies/search`)
            .set('Authorization', `Bearer ${generateJwToken(user)}`)
            .send(payload);
        return {
            status,
            body,
        };
    }

    describe('Projection', () => {
        it('SHOULD return 200 OK WITH particular columns only', async () => {
            // Act
            const { status, body } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            (body as SearchResult<VocabularySearchResponse>).results.forEach((vocabulary) => {
                expect(vocabulary).toStrictEqual({
                    id: expect.any(String),
                    word: expect.any(String),
                    isInLeitnerBox: expect.any(Boolean),
                    definitions: expect.any(Definition),
                });
                vocabulary.definitions.forEach((definition) => {
                    expect(definition).toStrictEqual({
                        id: expect.any(String),
                        meaning: expect.any(String),
                    });
                });
            });
        });
    });

    describe('Leitner Box', () => {
        it('SHOULD return 200 OK with "isInLeitnerBox"', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            // leitner item from the first user
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            // request for the first user
            const { status, body } = await makeApiRequest();
            expect(status).toBe(200);
            const { results } = body as SearchResult<VocabularySearchResponse>;
            const foundVocabulary = results.find((result) => result.id === vocabulary.id);
            expect(foundVocabulary.isInLeitnerBox).toBe(true);

            // request for the second user
            const { status: status2, body: body2 } = await makeApiRequest(secondUser);
            expect(status2).toBe(200);
            const { results: results2 } = body2 as SearchResult<VocabularySearchResponse>;
            const foundVocabulary2 = results2.find((result) => result.id === vocabulary.id);
            expect(foundVocabulary2.isInLeitnerBox).toBe(false);

            await removeLeitnerBoxItems(requester.id);
        });
    });

    describe('Fetch Not Having Definition Only', () => {
        it('SHOULD return 200 OK WITH only empty definition', async () => {
            // Arrange
            const word = `ROG_${Date.now()}`;
            const vocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    word,
                    definitions: [],
                    isDraft: true,
                },
                cohort.id,
            );

            // Act
            const { status, body } = await makeApiRequest(requester, {
                pagination: { pageSize: 5, pageNumber: 1 },
                searchKeyword: word,
                fetchNotHavingDefinitionOnly: true,
            });

            // Assert
            expect(status).toBe(200);
            const { results } = body as SearchResult<VocabularySearchResponse>;
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(vocabulary.id);
            expect(results[0].word).toBe(word);
        });

        it('SHOULD return 200 OK WITH vocabularies indifferent to the empty definition', async () => {
            // Arrange
            const vocabularyIds: string[] = [];
            let vocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    word: `ROG_${Date.now()}`,
                    definitions: [],
                    isDraft: true,
                },
                cohort.id,
            );
            vocabularyIds.push(vocabulary.id);

            vocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    word: `ROG_${Date.now()}`,
                },
                cohort.id,
            );
            vocabularyIds.push(vocabulary.id);

            // Act
            const { status, body } = await makeApiRequest(requester, {
                pagination: { pageSize: 5, pageNumber: 1 },
                searchKeyword: 'ROG',
                fetchNotHavingDefinitionOnly: false,
                sort: {
                    direction: SortDirection.DESC,
                    field: SupportedSortFields.createdAt,
                },
            });

            // Assert
            expect(status).toBe(200);
            const { results } = body as SearchResult<VocabularySearchResponse>;
            expect(results.length).toBeGreaterThanOrEqual(2);
            vocabularyIds.forEach((vocabularyId) => {
                expect(results.some(({ id }) => vocabularyId === id)).toBe(true);
            });
        });
    });

    describe('Searching', () => {
        it('SHOULD return 400 BAD REQUEST WHEN vocabularySearchCoverage.word is not defined', async () => {
            // Arrange
            const payload: VocabularySearchRequest = {
                pagination: { pageSize: 5, pageNumber: 1 },
                vocabularySearchCoverage: {
                    word: undefined,
                    linkerWords: false,
                    genericNotes: false,
                    meaning: false,
                    examples: false,
                    notes: false,
                },
            };

            // Act
            const { status, body } = await makeApiRequest(requester, payload);

            // Assert
            expect(status).toBe(400);
            expect(
                (body as SupertestErrorResponse).message.includes(
                    `vocabularySearchCoverage.word must be a boolean value`,
                ),
            ).toBe(true);
        });

        it('SHOULD return 200 OK WHEN vocabularySearchCoverage.word is true AND a word exist matching the search keyword', async () => {
            // Arrange
            const searchKeyword = `ROG_${Date.now()}`;

            const payload: VocabularySearchRequest = {
                searchKeyword,
                pagination: { pageSize: 5, pageNumber: 1 },
                vocabularySearchCoverage: {
                    word: true,
                    linkerWords: false,
                    genericNotes: false,
                    meaning: false,
                    examples: false,
                    notes: false,
                },
            };

            const vocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    word: searchKeyword,
                },
                cohort.id,
            );

            // Act
            const { status, body } = await makeApiRequest(requester, payload);

            // Assert
            expect(status).toBe(200);
            const response = body as SearchResult<VocabularySearchResponse>;
            expect(response.results).toHaveLength(1);
            expect(response.results[0].id).toBe(vocabulary.id);
        });

        it('SHOULD return 200 OK WHEN vocabularySearchCoverage.linkerWords is true AND a linker word exist matching the search keyword', async () => {
            // Arrange
            const searchKeyword = `ROG_${Date.now()}`;

            const payload: VocabularySearchRequest = {
                searchKeyword,
                pagination: { pageSize: 5, pageNumber: 1 },
                vocabularySearchCoverage: {
                    word: false,
                    linkerWords: true,
                    genericNotes: false,
                    meaning: false,
                    examples: false,
                    notes: false,
                },
            };

            const vocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    linkerWords: [searchKeyword],
                },
                cohort.id,
            );

            // Act
            const { status, body } = await makeApiRequest(requester, payload);

            // Assert
            expect(status).toBe(200);
            const response = body as SearchResult<VocabularySearchResponse>;
            expect(response.results).toHaveLength(1);
            expect(response.results[0].id).toBe(vocabulary.id);
        });

        it('SHOULD return 200 OK WHEN vocabularySearchCoverage.genericNotes is true AND a generic note exist matching the search keyword', async () => {
            // Arrange
            const searchKeyword = `ROG_${Date.now()}`;

            const payload: VocabularySearchRequest = {
                searchKeyword,
                pagination: { pageSize: 5, pageNumber: 1 },
                vocabularySearchCoverage: {
                    word: false,
                    linkerWords: false,
                    genericNotes: true,
                    meaning: false,
                    examples: false,
                    notes: false,
                },
            };

            const vocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    genericNotes: [searchKeyword],
                },
                cohort.id,
            );

            // Act
            const { status, body } = await makeApiRequest(requester, payload);

            // Assert
            expect(status).toBe(200);
            const response = body as SearchResult<VocabularySearchResponse>;
            expect(response.results).toHaveLength(1);
            expect(response.results[0].id).toBe(vocabulary.id);
        });

        it('SHOULD return 200 OK WHEN vocabularySearchCoverage.meaning is true AND a meaning exist matching the search keyword', async () => {
            // Arrange
            const searchKeyword = `ROG_${Date.now()}`;

            const payload: VocabularySearchRequest = {
                searchKeyword,
                pagination: { pageSize: 5, pageNumber: 1 },
                vocabularySearchCoverage: {
                    word: false,
                    linkerWords: false,
                    genericNotes: false,
                    meaning: true,
                    examples: false,
                    notes: false,
                },
            };

            const baseVocabulary = getVocabularyWithDefinitions();
            const vocabulary = await createVocabulary(
                {
                    ...baseVocabulary,
                    definitions: [
                        {
                            ...baseVocabulary.definitions[0],
                            meaning: searchKeyword,
                        },
                    ],
                },
                cohort.id,
            );

            // Act
            const { status, body } = await makeApiRequest(requester, payload);

            // Assert
            expect(status).toBe(200);
            const response = body as SearchResult<VocabularySearchResponse>;
            expect(response.results).toHaveLength(1);
            expect(response.results[0].id).toBe(vocabulary.id);
        });

        it('SHOULD return 200 OK WHEN vocabularySearchCoverage.examples is true AND an example exist matching the search keyword', async () => {
            // Arrange
            const searchKeyword = `ROG_${Date.now()}`;

            const payload: VocabularySearchRequest = {
                searchKeyword,
                pagination: { pageSize: 5, pageNumber: 1 },
                vocabularySearchCoverage: {
                    word: false,
                    linkerWords: false,
                    genericNotes: false,
                    meaning: false,
                    examples: true,
                    notes: false,
                },
            };

            const baseVocabulary = getVocabularyWithDefinitions();
            const vocabulary = await createVocabulary(
                {
                    ...baseVocabulary,
                    definitions: [
                        {
                            ...baseVocabulary.definitions[0],
                            examples: [searchKeyword],
                        },
                    ],
                },
                cohort.id,
            );

            // Act
            const { status, body } = await makeApiRequest(requester, payload);

            // Assert
            expect(status).toBe(200);
            const response = body as SearchResult<VocabularySearchResponse>;
            expect(response.results).toHaveLength(1);
            expect(response.results[0].id).toBe(vocabulary.id);
        });

        it('SHOULD return 200 OK WHEN vocabularySearchCoverage.notes is true AND a notes exist matching the search keyword', async () => {
            // Arrange
            const searchKeyword = `ROG_${Date.now()}`;

            const payload: VocabularySearchRequest = {
                searchKeyword,
                pagination: { pageSize: 5, pageNumber: 1 },
                vocabularySearchCoverage: {
                    word: false,
                    linkerWords: false,
                    genericNotes: false,
                    meaning: false,
                    examples: false,
                    notes: true,
                },
            };

            const baseVocabulary = getVocabularyWithDefinitions();
            const vocabulary = await createVocabulary(
                {
                    ...baseVocabulary,
                    definitions: [
                        {
                            ...baseVocabulary.definitions[0],
                            notes: [searchKeyword],
                        },
                    ],
                },
                cohort.id,
            );

            // Act
            const { status, body } = await makeApiRequest(requester, payload);

            // Assert
            expect(status).toBe(200);
            const response = body as SearchResult<VocabularySearchResponse>;
            expect(response.results).toHaveLength(1);
            expect(response.results[0].id).toBe(vocabulary.id);
        });

        it('SHOULD return 200 OK WHEN all properties of vocabularySearchCoverage is true AND a vocab exist matching the search keyword', async () => {
            // Arrange
            const searchKeyword = `ROG_${Date.now()}`;

            const payload: VocabularySearchRequest = {
                searchKeyword,
                pagination: { pageSize: 5, pageNumber: 1 },
                vocabularySearchCoverage: {
                    word: true,
                    linkerWords: true,
                    genericNotes: true,
                    meaning: true,
                    examples: true,
                    notes: true,
                },
            };

            const vocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    word: searchKeyword,
                },
                cohort.id,
            );

            // Act
            const { status, body } = await makeApiRequest(requester, payload);

            // Assert
            expect(status).toBe(200);
            const response = body as SearchResult<VocabularySearchResponse>;
            expect(response.results).toHaveLength(1);
            expect(response.results[0].id).toBe(vocabulary.id);
        });
    });
});
