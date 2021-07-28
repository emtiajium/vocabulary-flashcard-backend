import { INestApplication } from '@nestjs/common';
import User from '@/user/domains/User';
import Cohort from '@/user/domains/Cohort';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import { v4 as uuidV4 } from 'uuid';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { createApiRequester, removeUserByUsername } from '@test/util/user-util';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import CohortService from '@/user/services/CohortService';
import { createVocabulary, removeVocabularyAndRelationsByCohortId } from '@test/util/vocabulary-util';
import { createItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import getAppAPIPrefix from '@test/util/service-util';
import generateJwToken from '@test/util/auth-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import SearchResult from '@/common/domains/SearchResult';
import LeitnerBoxItem from '@/vocabulary/domains/LeitnerBoxItem';
import MomentUnit, { getFormattedDate, makeItNewer, makeItOlder } from '@/common/utils/moment-util';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import LeitnerBoxAppearanceDifference from '@/vocabulary/domains/LeitnerBoxAppearanceDifference';

describe('Leitner Systems Box Items', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    function getVocabularyWithDefinitions(): Vocabulary {
        const definition = new Definition();
        definition.id = uuidV4();
        definition.meaning = 'Meaning 1';
        definition.examples = ['Example 1'];
        definition.notes = ['Notes 1'];
        definition.externalLinks = ['https://gibberish.com/public/static/blah.html'];

        const vocabulary = new Vocabulary();
        vocabulary.id = uuidV4();
        vocabulary.isDraft = false;
        vocabulary.word = 'Word 1';
        definition.vocabularyId = vocabulary.id;
        vocabulary.definitions = [definition];

        return vocabulary;
    }

    async function makeApiRequest(box: LeitnerBoxType): Promise<SupertestResponse<SearchResult<LeitnerBoxItem>>> {
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
        app = await bootstrap(AppModule);
        requester = await createApiRequester();
        const cohortName = 'Leitner Systems Automated Test';
        cohort = await createCohort({ name: cohortName, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.username]);
    });

    afterAll(async () => {
        await Promise.all([removeVocabularyAndRelationsByCohortId(cohort.id)]);
        await removeUserByUsername(requester.username);
        await Promise.all([removeCohortByName(cohort.name)]);
        await removeLeitnerBoxItems(requester.id);
        await app.close();
    });

    describe('Box 1', () => {
        beforeEach(async () => {
            await removeLeitnerBoxItems(requester.id);
        });

        it('SHOULD return 200 OK with empty array', async () => {
            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_1);

            expect(status).toBe(200);
            const response = body as SearchResult<LeitnerBoxItem>;
            expect(response.total).toBe(0);
            expect(response.results).toHaveLength(0);
        });

        it('SHOULD return 200 OK', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_1);

            expect(status).toBe(200);
            const response = body as SearchResult<LeitnerBoxItem>;
            expect(response.total).toBeGreaterThanOrEqual(1);
            expect(response.results.length).toBeGreaterThanOrEqual(1);
            response.results.forEach((item) => {
                expect(item.word).toBe(vocabulary.word);
                expect(item.vocabularyId).toBe(vocabulary.id);
            });
        });
    });

    describe('Box 2', () => {
        beforeEach(async () => {
            await removeLeitnerBoxItems(requester.id);
        });

        it('SHOULD return 200 OK with empty results for an early request', async () => {
            const past = makeItOlder(new Date(), MomentUnit.DAYS, 1);
            const getTomorrowMock = jest
                .spyOn(app.get(LeitnerSystemsRepository), 'getTomorrow')
                .mockImplementation(() => getFormattedDate(past));

            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_2);

            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_2);

            expect(status).toBe(200);
            const response = body as SearchResult<LeitnerBoxItem>;
            expect(response.total).toBe(0);
            expect(response.results.length).toBe(0);

            getTomorrowMock.mockRestore();
        });

        it('SHOULD return 200 OK', async () => {
            const future = makeItNewer(new Date(), MomentUnit.DAYS, LeitnerBoxAppearanceDifference.BOX_2);
            const getTomorrowMock = jest
                .spyOn(app.get(LeitnerSystemsRepository), 'getTomorrow')
                .mockImplementation(() => getFormattedDate(future));

            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_2);

            const { status, body } = await makeApiRequest(LeitnerBoxType.BOX_2);

            expect(status).toBe(200);
            const response = body as SearchResult<LeitnerBoxItem>;
            expect(response.total).toBe(1);
            expect(response.results.length).toBe(1);
            response.results.forEach((item) => {
                expect(item.word).toBe(vocabulary.word);
                expect(item.vocabularyId).toBe(vocabulary.id);
            });

            getTomorrowMock.mockRestore();
        });
    });
});
