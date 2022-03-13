import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import {
    createVocabulary,
    getVocabularyWithDefinitions,
    removeVocabularyAndRelationsByCohortId,
} from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester, createUser, removeUserByUsername } from '@test/util/user-util';
import CohortService from '@/user/services/CohortService';
import generateJwToken from '@test/util/auth-util';
import { createItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import SearchResult from '@/common/domains/SearchResult';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import { SortDirection, SupportedSortFields } from '@/common/domains/Sort';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';

describe('POST /v1/vocabularies/search', () => {
    let app: INestApplication;

    let requester: User;

    let secondUser: User;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        secondUser = await createUser({ username: `friend@firecracker.com`, firstname: 'Friend' } as User);
        const cohortName = 'Vocabulary Search Automated Test Cohort';
        cohort = await createCohort({ name: cohortName, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.username, secondUser.username]);
    });

    afterAll(async () => {
        await removeVocabularyAndRelationsByCohortId(cohort.id);
        await Promise.all([removeUserByUsername(requester.username), removeUserByUsername(secondUser.username)]);
        await removeCohortByName(cohort.name);
        await Promise.all([removeLeitnerBoxItems(requester.id), removeLeitnerBoxItems(secondUser.id)]);
        await app.close();
    });

    async function makeApiRequest(
        user: User = requester,
        payload: VocabularySearch = { pagination: { pageSize: 5, pageNumber: 1 } } as VocabularySearch,
    ): Promise<SupertestResponse<SearchResult<Vocabulary>>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/vocabularies/search`)
            .set('Authorization', `Bearer ${generateJwToken(user)}`)
            .send(payload);
        return {
            status,
            body,
        };
    }

    describe('Leitner Box', () => {
        it('SHOULD return 200 OK with "isInLeitnerBox"', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            // leitner item from the first user
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            // request for the first user
            const { status, body } = await makeApiRequest();
            expect(status).toBe(200);
            const { results } = body as SearchResult<Vocabulary>;
            const foundVocabulary = results.find((result) => result.id === vocabulary.id);
            expect(foundVocabulary.isInLeitnerBox).toBe(true);

            // request for the second user
            const { status: status2, body: body2 } = await makeApiRequest(secondUser);
            expect(status2).toBe(200);
            const { results: results2 } = body2 as SearchResult<Vocabulary>;
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
            const { results } = body as SearchResult<Vocabulary>;
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
            const { results } = body as SearchResult<Vocabulary>;
            expect(results.length).toBeGreaterThan(2);
            vocabularyIds.forEach((vocabularyId) => {
                expect(results.some(({ id }) => vocabularyId === id)).toBe(true);
            });
        });
    });
});
