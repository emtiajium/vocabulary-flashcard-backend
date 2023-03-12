import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { addUsersToCohort, createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import {
    createApiRequester,
    createUser,
    generateUsername,
    removeUsersByUsernames,
    resetCohortById,
} from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import { createItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

describe('GET /v1/vocabularies/:id', () => {
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
    ): Promise<SupertestResponse<Vocabulary>> {
        const { status, body } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/vocabularies/${vocabularyId}`)
            .set('Authorization', `Bearer ${generateJwToken(requestedUser)}`)
            .send();
        return {
            status,
            body,
        };
    }

    it('SHOULD return 404 NOT FOUND WHEN the vocabulary does not exist', async () => {
        const vocabularyId = uuidV4();

        const { status, body } = await makeApiRequest(vocabularyId);

        expect(status).toBe(404);
        expect((body as SupertestErrorResponse).message).toBe(`Vocabulary with ID "${vocabularyId}" does not exist`);
    });

    it('SHOULD return 200 OK WITH isInLeitnerBox as true WHEN the vocabulary is a leitner item made by the requester', async () => {
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
        await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

        const { status, body } = await makeApiRequest(vocabulary.id);

        expect(status).toBe(200);
        expect((body as Vocabulary).isInLeitnerBox).toBe(true);
    });

    it('SHOULD return 200 OK WITH isInLeitnerBox as false WHEN the vocabulary is a leitner item made by another member of the cohort', async () => {
        const secondUser = await createUser({
            username: generateUsername(),
            firstname: 'Friend',
        } as User);
        await addUsersToCohort(cohort.name, [secondUser.username]);
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
        await createItem(secondUser.id, vocabulary.id, LeitnerBoxType.BOX_1);

        const { status, body } = await makeApiRequest(vocabulary.id);

        expect(status).toBe(200);
        expect((body as Vocabulary).isInLeitnerBox).toBe(false);

        await resetCohortById(secondUser.id);
        await removeLeitnerBoxItems(secondUser.id);
        await removeUsersByUsernames([secondUser.username]);
    });

    it('SHOULD return 200 OK WITH vocabulary and definitions', async () => {
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

        const { status, body } = await makeApiRequest(vocabulary.id);

        expect(status).toBe(200);
        expect(body as Vocabulary).toStrictEqual({
            id: vocabulary.id,
            word: vocabulary.word,
            genericNotes: vocabulary.genericNotes,
            genericExternalLinks: vocabulary.genericExternalLinks,
            linkerWords: vocabulary.linkerWords,
            isDraft: vocabulary.isDraft,
            definitions: expect.arrayContaining([
                {
                    id: vocabulary.definitions[0].id,
                    vocabularyId: vocabulary.definitions[0].vocabularyId,
                    meaning: vocabulary.definitions[0].meaning,
                    examples: vocabulary.definitions[0].examples,
                    notes: vocabulary.definitions[0].notes,
                    externalLinks: vocabulary.definitions[0].externalLinks,
                },
            ]),
            isInLeitnerBox: false,
        });
    });
});
