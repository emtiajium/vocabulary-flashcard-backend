import { INestApplication } from '@nestjs/common';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import getAppAPIPrefix from '@test/util/service-util';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import { getSingleVocabularyByCohortId, removeVocabularyAndRelationsByCohortId } from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester, removeUserByUsername } from '@test/util/user-util';
import CohortService from '@/user/services/CohortService';
import generateJwToken from '@test/util/auth-util';
import newJoinerVocabularyList from '@/manual-scripts/new-joiner-vocabulary-list';
import SearchResult from '@/common/domains/SearchResult';

describe('/v1/vocabularies/bootstrap', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await bootstrap(AppModule);
        requester = await createApiRequester();
        const cohortName = 'Bootstrap Cohort';
        cohort = await createCohort({ name: cohortName, userIds: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.id]);
    });

    afterAll(async () => {
        await removeUserByUsername(requester.username);
        await removeCohortByName(cohort.name);
        await app.close();
    });

    async function makeApiRequest(): Promise<SupertestResponse<SearchResult<Vocabulary>>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/vocabularies/bootstrap`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`)
            .send();
        return {
            status,
            body,
        };
    }

    it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
        const { status } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/vocabularies/bootstrap`)
            .send();
        expect(status).toBe(403);
    });

    it('SHOULD return 201 CREATED for the brand new user', async () => {
        const { status, body } = await makeApiRequest();

        expect(status).toBe(201);

        const vocabulary = await getSingleVocabularyByCohortId(cohort.id);
        expect(vocabulary.id).toBeDefined();
        expect(vocabulary.cohortId).toBe(cohort.id);

        const vocabularies = (body as SearchResult<Vocabulary>).results;

        expect(vocabularies).toHaveLength(newJoinerVocabularyList.length);
        expect((body as SearchResult<Vocabulary>).total).toBe(newJoinerVocabularyList.length);

        vocabularies.forEach(({ cohortId }) => {
            expect(cohortId).toBe(cohort.id);
        });
        await removeVocabularyAndRelationsByCohortId(cohort.id);
    });

    it('SHOULD return 409 Conflict WHEN /bootstrap is executed earlier', async () => {
        await makeApiRequest();
        const { status } = await makeApiRequest();
        expect(status).toBe(409);
        await removeVocabularyAndRelationsByCohortId(cohort.id);
    });
});
