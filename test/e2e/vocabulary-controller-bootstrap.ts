import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Cohort from '@/user/domains/Cohort';
import { addUsersToCohort, createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import {
    createVocabulary,
    getSingleVocabularyByCohortId,
    getVocabularyWithDefinitions,
} from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester } from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import getNewJoinerVocabularyList from '@/manual-scripts/new-joiner-vocabulary-list';
import SearchResult from '@/common/domains/SearchResult';
import PartialVocabulary from '@/vocabulary/domains/PartialVocabulary';
import DataSource from '@/common/persistence/TypeormConfig';

jest.mock('@/manual-scripts/new-joiner-vocabulary-list', () => {
    const originalModule = jest.requireActual('@/manual-scripts/new-joiner-vocabulary-list');
    return {
        __esModule: true,
        ...originalModule,
        default: (): PartialVocabulary[] => {
            return originalModule.default().slice(0, 1);
        },
    };
});

describe('/v1/vocabularies/bootstrap', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
        requester = await createApiRequester();
        cohort = await createCohort({ name: `Cohort _ ${uuid.v4()}`, usernames: [] } as Cohort);
        await addUsersToCohort(cohort.name, [requester.username]);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.close();
        await DataSource.destroy();
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

    it('SHOULD return 201 CREATED for the brand new user WITHOUT cohort ID as the API response', async () => {
        const { status, body } = await makeApiRequest();

        expect(status).toBe(201);

        const vocabulary = await getSingleVocabularyByCohortId(cohort.id);
        expect(vocabulary.id).toBeDefined();
        expect(vocabulary.cohortId).toBe(cohort.id);

        const vocabularies = (body as SearchResult<Vocabulary>).results;

        expect(vocabularies).toHaveLength(getNewJoinerVocabularyList().length);
        expect(vocabularies).toHaveLength(1); // evaluating mocked methods
        expect((body as SearchResult<Vocabulary>).total).toBe(getNewJoinerVocabularyList().length);

        vocabularies.forEach((currentVocabulary) => {
            expect(currentVocabulary.cohortId).toBeUndefined();
            expect(currentVocabulary.cohort).toBeUndefined();
        });
    });

    it('SHOULD return 409 Conflict WHEN the user has vocabulary', async () => {
        await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

        const { status, body } = await makeApiRequest();

        expect(status).toBe(409);
        expect(body as SupertestErrorResponse).toStrictEqual({
            name: `ExistingVocabConflict`,
            message: `Requested cohort has at least one vocabulary`,
        });
    });
});
