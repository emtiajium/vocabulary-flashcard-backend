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

    async function makeApiRequest(user: User = requester): Promise<SupertestResponse<SearchResult<Vocabulary>>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/vocabularies/search`)
            .set('Authorization', `Bearer ${generateJwToken(user)}`)
            .send({ pagination: { pageSize: 5, pageNumber: 1 } });
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
});
