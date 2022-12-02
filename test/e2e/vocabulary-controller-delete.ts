import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import {
    createVocabulary,
    getDefinitionsByVocabularyId,
    getVocabularyById,
    getVocabularyWithDefinitions,
} from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import {
    createApiRequester,
    createUser,
    generateUsername,
    removeUsersByUsernames,
    resetCohortById,
} from '@test/util/user-util';
import CohortService from '@/user/services/CohortService';
import generateJwToken from '@test/util/auth-util';
import { createItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';

describe('DELETE /v1/vocabularies/:id', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        const cohortName = `Cohort _ ${uuidV4()}`;
        cohort = await createCohort({ name: cohortName, usernames: [requester.username] } as Cohort);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.close();
    });

    async function makeApiRequest(
        vocabularyId: string,
        requestedUser: User = requester,
    ): Promise<SupertestResponse<void>> {
        const { status, body } = await request(app.getHttpServer())
            .delete(`${getAppAPIPrefix()}/v1/vocabularies/${vocabularyId}`)
            .set('Authorization', `Bearer ${generateJwToken(requestedUser)}`)
            .send();
        return {
            status,
            body,
        };
    }

    it('SHOULD return 404 NOT FOUND WHEN the vocabulary does not exist', async () => {
        const { status } = await makeApiRequest(uuidV4());

        expect(status).toBe(404);
    });

    it('SHOULD return 422 UNPROCESSABLE ENTITY WHEN the vocabulary is a leitner item made by the requester', async () => {
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
        await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

        const { status } = await makeApiRequest(vocabulary.id);

        expect(status).toBe(422);
    });

    it('SHOULD return 422 UNPROCESSABLE ENTITY WHEN the vocabulary is a leitner item made by another member of the cohort', async () => {
        const secondUser = await createUser({
            username: generateUsername(),
            firstname: 'Friend',
        } as User);
        await app.get(CohortService).addUsersToCohort(cohort.name, [secondUser.username]);
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
        await createItem(secondUser.id, vocabulary.id, LeitnerBoxType.BOX_1);

        const { status } = await makeApiRequest(vocabulary.id);

        expect(status).toBe(422);

        await resetCohortById(secondUser.id);
        await removeLeitnerBoxItems(secondUser.id);
        await removeUsersByUsernames([secondUser.username]);
    });

    it('SHOULD return 403 FORBIDDEN WHEN outsider wants to delete a vocabulary', async () => {
        const secondUser = await createUser({
            username: generateUsername(),
            firstname: 'Intruder',
        } as User);

        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

        const { status } = await makeApiRequest(vocabulary.id, secondUser);

        expect(status).toBe(403);

        await removeUsersByUsernames([secondUser.username]);
    });

    it('SHOULD return 200 OK AND delete the vocabulary and definitions', async () => {
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

        const { status } = await makeApiRequest(vocabulary.id);

        expect(status).toBe(200);
        expect(await getVocabularyById(vocabulary.id)).toBeUndefined();
        expect(await getDefinitionsByVocabularyId(vocabulary.id)).toHaveLength(0);
    });
});
