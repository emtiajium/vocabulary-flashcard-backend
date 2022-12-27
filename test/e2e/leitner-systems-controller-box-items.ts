import { INestApplication } from '@nestjs/common';
import User from '@/user/domains/User';
import Cohort from '@/user/domains/Cohort';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { createApiRequester } from '@test/util/user-util';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import { createItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import generateJwToken from '@test/util/auth-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import MomentUnit, { delay, getFormattedDate, makeItNewer, makeItOlder } from '@/common/utils/moment-util';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import LeitnerBoxItemSearchResult from '@/vocabulary/domains/LeitnerBoxItemSearchResult';

describe('Leitner Systems Box Items', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    async function makeApiRequest(box: LeitnerBoxType): Promise<SupertestResponse<LeitnerBoxItemSearchResult>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/leitner-systems/items/${box}`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`)
            .send({ pagination: { pageSize: 10, pageNumber: 1 } });
        return {
            status,
            body,
        };
    }

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        const cohortName = `Cohort _ ${uuid.v4()}`;
        cohort = await createCohort({ name: cohortName, usernames: [requester.username] } as Cohort);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.close();
    });

    describe('Box 1', () => {
        beforeEach(async () => {
            await removeLeitnerBoxItems(requester.id);
        });

        it('SHOULD return 200 OK with empty array', async () => {
            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_1);

            expect(status).toBe(200);
            const response = body as LeitnerBoxItemSearchResult;
            expect(response.total).toBe(0);
            expect(response.results).toHaveLength(0);
            expect(response.singleLeitnerItemEarlierToBoxAppearanceDate).toBeUndefined();
        });

        it('SHOULD return 200 OK', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            const { updatedAt } = await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_1);

            expect(status).toBe(200);
            const response = body as LeitnerBoxItemSearchResult;
            expect(response.singleLeitnerItemEarlierToBoxAppearanceDate).toBeUndefined();
            expect(response.total).toBeGreaterThanOrEqual(1);
            expect(response.results.length).toBeGreaterThanOrEqual(1);
            response.results.forEach((item) => {
                expect(Object.keys(item).sort()).toStrictEqual(['word', 'vocabularyId', 'updatedAt'].sort());
                expect(item.word).toBe(vocabulary.word);
                expect(item.vocabularyId).toBe(vocabulary.id);
                expect(item.updatedAt).toBe(updatedAt.toISOString());
            });
        });

        it('SHOULD return 200 OK with ascending order', async () => {
            const [vocabulary, secondVocabulary] = await Promise.all([
                createVocabulary(getVocabularyWithDefinitions(), cohort.id),
                createVocabulary(getVocabularyWithDefinitions(), cohort.id),
            ]);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);
            await delay(2);
            await createItem(requester.id, secondVocabulary.id, LeitnerBoxType.BOX_1);

            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_1);

            expect(status).toBe(200);
            const response = body as LeitnerBoxItemSearchResult;
            expect(response.singleLeitnerItemEarlierToBoxAppearanceDate).toBeUndefined();
            expect(response.total).toBe(2);
            expect(response.results[0].vocabularyId).toBe(vocabulary.id);
            expect(response.results[1].vocabularyId).toBe(secondVocabulary.id);
        });
    });

    describe('Box 2', () => {
        beforeEach(async () => {
            await removeLeitnerBoxItems(requester.id);
        });

        it('SHOULD return 200 OK with empty results for an early request WITH a single item', async () => {
            const past = makeItOlder(new Date(), MomentUnit.DAYS, 1);
            const getTomorrowMock = jest
                .spyOn(app.get(LeitnerSystemsRepository), 'getTomorrow')
                .mockImplementation(() => getFormattedDate(past));

            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            const item = await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_2);

            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_2);

            expect(status).toBe(200);
            const response = body as LeitnerBoxItemSearchResult;
            expect(response.total).toBe(0);
            expect(response.results.length).toBe(0);
            expect(response.singleLeitnerItemEarlierToBoxAppearanceDate).toStrictEqual({
                vocabulary: { word: vocabulary.word },
                boxAppearanceDate: item.boxAppearanceDate.toISOString(),
            });

            getTomorrowMock.mockRestore();
        });

        it('SHOULD return 200 OK', async () => {
            const future = makeItNewer(new Date(), MomentUnit.DAYS, 5);
            const getTomorrowMock = jest
                .spyOn(app.get(LeitnerSystemsRepository), 'getTomorrow')
                .mockImplementation(() => getFormattedDate(future));

            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            const { updatedAt } = await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_2);

            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_2);

            expect(status).toBe(200);
            const response = body as LeitnerBoxItemSearchResult;
            expect(response.singleLeitnerItemEarlierToBoxAppearanceDate).toBeUndefined();
            expect(response.total).toBe(1);
            expect(response.results.length).toBe(1);
            response.results.forEach((item) => {
                expect(item).toStrictEqual({
                    word: vocabulary.word,
                    vocabularyId: vocabulary.id,
                    updatedAt: updatedAt.toISOString(),
                });
            });

            getTomorrowMock.mockRestore();
        });
    });
});
