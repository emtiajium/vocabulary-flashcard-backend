import { INestApplication } from '@nestjs/common';
import User from '@/user/domains/User';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { createApiRequester } from '@test/util/user-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import generateJwToken from '@test/util/auth-util';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import Cohort from '@/user/domains/Cohort';
import CohortService from '@/user/services/CohortService';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import { createItem, getLeitnerBoxItem } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import MomentUnit, { momentDiff } from '@/common/utils/moment-util';
import LeitnerBoxAppearanceDifference from '@/vocabulary/domains/LeitnerBoxAppearanceDifference';

describe('Leitner Systems Entry', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    let fakeCohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        const cohortName = `Cohort _ ${uuidV4()}`;
        cohort = await createCohort({ name: cohortName, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.username]);
        fakeCohort = await createCohort({ name: `Cohort _ ${uuidV4()}`, usernames: [] } as Cohort);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id, fakeCohort.id]);
        await app.close();
    });

    describe('placeIntoFirstLeitnerBox', () => {
        async function makeApiRequest(vocabularyId: string): Promise<SupertestResponse<void>> {
            const { status, body } = await request(app.getHttpServer())
                .post(`${getAppAPIPrefix()}/v1/leitner-systems/start/${vocabularyId}`)
                .set('Authorization', `Bearer ${generateJwToken(requester)}`)
                .send();
            return {
                status,
                body,
            };
        }

        it('SHOULD return 404 NOT FOUND for an unknown vocabulary', async () => {
            const { status } = await makeApiRequest(uuidV4());
            expect(status).toBe(404);

            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), fakeCohort.id);

            const { status: status2 } = await makeApiRequest(vocabulary.id);
            expect(status2).toBe(404);
        });

        it('SHOULD return 201 CREATED', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(201);

            const item = await getLeitnerBoxItem(requester.id, vocabulary.id);
            expect(item.currentBox).toBe(LeitnerBoxType.BOX_1);
            expect(momentDiff(new Date(), new Date(item.boxAppearanceDate), MomentUnit.DAYS)).toBe(0);
        });

        it('SHOULD return 409 CONFLICT', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            await makeApiRequest(vocabulary.id);

            const { status, body } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(409);
            expect((body as SupertestErrorResponse).message).toBe(`You already made a flashcard with this vocabulary.`);
        });
    });

    describe('moveForward', () => {
        async function makeApiRequest(vocabularyId: string): Promise<SupertestResponse<void>> {
            const { status, body } = await request(app.getHttpServer())
                .put(`${getAppAPIPrefix()}/v1/leitner-systems/forward/${vocabularyId}`)
                .set('Authorization', `Bearer ${generateJwToken(requester)}`)
                .send();
            return {
                status,
                body,
            };
        }

        it('SHOULD return 404 NOT FOUND WHEN the vocabulary does not exist', async () => {
            const { status } = await makeApiRequest(uuidV4());
            expect(status).toBe(404);

            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), fakeCohort.id);

            const { status: status2 } = await makeApiRequest(vocabulary.id);
            expect(status2).toBe(404);
        });

        it('SHOULD return 404 NOT FOUND WHEN the vocabulary does not exist into the leitner box', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(404);
        });

        it('SHOULD return 409 CONFLICT WHEN the vocabulary in in the last leitner box', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_5);

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(409);
        });

        it('SHOULD return 200 OK WHEN moving from Box 1 to Box 2', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(200);

            const item = await getLeitnerBoxItem(requester.id, vocabulary.id);
            expect(item.currentBox).toBe(LeitnerBoxType.BOX_2);
            expect(momentDiff(new Date(), new Date(item.boxAppearanceDate), MomentUnit.DAYS)).toBe(
                LeitnerBoxAppearanceDifference.BOX_2,
            );
        });

        it('SHOULD return 200 OK WHEN moving from Box 2 to Box 3', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            // Box 2
            await makeApiRequest(vocabulary.id);

            // Box 3
            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(200);

            const item = await getLeitnerBoxItem(requester.id, vocabulary.id);
            expect(item.currentBox).toBe(LeitnerBoxType.BOX_3);
            expect(momentDiff(new Date(), new Date(item.boxAppearanceDate), MomentUnit.DAYS)).toBe(
                LeitnerBoxAppearanceDifference.BOX_3,
            );
        });

        it('SHOULD return 200 OK WHEN moving from Box 3 to Box 4', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            // Box 2
            await makeApiRequest(vocabulary.id);

            // Box 3
            await makeApiRequest(vocabulary.id);

            // Box 4
            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(200);

            const item = await getLeitnerBoxItem(requester.id, vocabulary.id);
            expect(item.currentBox).toBe(LeitnerBoxType.BOX_4);
            expect(momentDiff(new Date(), new Date(item.boxAppearanceDate), MomentUnit.DAYS)).toBe(
                LeitnerBoxAppearanceDifference.BOX_4,
            );
        });

        it('SHOULD return 200 OK WHEN moving from Box 4 to Box 5', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            // Box 2
            await makeApiRequest(vocabulary.id);

            // Box 3
            await makeApiRequest(vocabulary.id);

            // Box 4
            await makeApiRequest(vocabulary.id);

            // Box 5
            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(200);

            const item = await getLeitnerBoxItem(requester.id, vocabulary.id);
            expect(item.currentBox).toBe(LeitnerBoxType.BOX_5);
            expect(momentDiff(new Date(), new Date(item.boxAppearanceDate), MomentUnit.DAYS)).toBe(
                LeitnerBoxAppearanceDifference.BOX_5,
            );
        });
    });

    describe('moveBackward', () => {
        async function makeApiRequest(vocabularyId: string): Promise<SupertestResponse<void>> {
            const { status, body } = await request(app.getHttpServer())
                .put(`${getAppAPIPrefix()}/v1/leitner-systems/backward/${vocabularyId}`)
                .set('Authorization', `Bearer ${generateJwToken(requester)}`)
                .send();
            return {
                status,
                body,
            };
        }

        it('SHOULD return 404 NOT FOUND WHEN the vocabulary does not exist', async () => {
            const { status } = await makeApiRequest(uuidV4());
            expect(status).toBe(404);

            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), fakeCohort.id);

            const { status: status2 } = await makeApiRequest(vocabulary.id);
            expect(status2).toBe(404);
        });

        it('SHOULD return 404 NOT FOUND WHEN the vocabulary does not exist into the leitner box', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(404);
        });

        it('SHOULD return 409 CONFLICT WHEN the vocabulary in in the first leitner box', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(409);
        });

        it('SHOULD return 200 OK WHEN moving from Box 2 to Box 1', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_2);

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(200);

            const item = await getLeitnerBoxItem(requester.id, vocabulary.id);
            expect(item.currentBox).toBe(LeitnerBoxType.BOX_1);
            expect(momentDiff(new Date(), new Date(item.boxAppearanceDate), MomentUnit.DAYS)).toBe(0);
        });

        it('SHOULD return 200 OK WHEN moving from Box 4 to Box 3', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_4);

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(200);

            const item = await getLeitnerBoxItem(requester.id, vocabulary.id);
            expect(item.currentBox).toBe(LeitnerBoxType.BOX_3);
            expect(momentDiff(new Date(), new Date(item.boxAppearanceDate), MomentUnit.DAYS)).toBe(0);
        });
    });
});
