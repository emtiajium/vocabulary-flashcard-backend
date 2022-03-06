import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import {
    createVocabulary,
    getVocabularyWithDefinitions,
    removeVocabularyAndRelationsByCohortId,
} from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester, removeUserByUsername } from '@test/util/user-util';
import CohortService from '@/user/services/CohortService';
import generateJwToken from '@test/util/auth-util';
import { createItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';

describe('DELETE /v1/vocabularies', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        const cohortName = 'Vocabulary Delete Automated Test Cohort';
        cohort = await createCohort({ name: cohortName, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.username]);
    });

    afterAll(async () => {
        await removeVocabularyAndRelationsByCohortId(cohort.id);
        await removeUserByUsername(requester.username);
        await removeCohortByName(cohort.name);
        await removeLeitnerBoxItems(requester.id);
        await app.close();
    });

    async function makeApiRequest(vocabularyId: string): Promise<SupertestResponse<void>> {
        const { status, body } = await request(app.getHttpServer())
            .delete(`${getAppAPIPrefix()}/v1/vocabularies/${vocabularyId}`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`)
            .send();
        return {
            status,
            body,
        };
    }

    it('SHOULD return 404 NOT FOUND', async () => {
        const { status } = await makeApiRequest(uuidV4());
        expect(status).toBe(404);
    });

    it('SHOULD return 412 UNPROCESSABLE ENTITY', async () => {
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
        await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

        const { status } = await makeApiRequest(vocabulary.id);
        expect(status).toBe(422);
    });

    it('SHOULD return 200 OK', async () => {
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

        const { status } = await makeApiRequest(vocabulary.id);
        expect(status).toBe(200);
    });
});
