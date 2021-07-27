import { INestApplication } from '@nestjs/common';
import User from '@/user/domains/User';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { createApiRequester, removeUserByUsername } from '@test/util/user-util';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import generateJwToken from '@test/util/auth-util';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import Cohort from '@/user/domains/Cohort';
import CohortService from '@/user/services/CohortService';
import { createVocabulary, removeVocabularyAndRelationsByCohortId } from '@test/util/vocabulary-util';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import { getLeitnerBoxItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import MomentUnit, { momentDiff } from '@/common/utils/moment-util';

describe('Leitner Systems Entry', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    let fakeCohort: Cohort;

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

    beforeAll(async () => {
        app = await bootstrap(AppModule);
        requester = await createApiRequester();
        const cohortName = 'Leitner Systems Automated Test';
        cohort = await createCohort({ name: cohortName, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.username]);
        fakeCohort = await createCohort({ name: 'Fake Cohort', usernames: [] } as Cohort);
    });

    afterAll(async () => {
        await Promise.all([
            removeVocabularyAndRelationsByCohortId(cohort.id),
            removeVocabularyAndRelationsByCohortId(fakeCohort.id),
        ]);
        await removeUserByUsername(requester.username);
        await Promise.all([removeCohortByName(cohort.name), removeCohortByName(fakeCohort.name)]);
        await removeLeitnerBoxItems(requester.id);
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

            const { status } = await makeApiRequest(vocabulary.id);
            expect(status).toBe(409);
        });
    });

    describe('moveForward', () => {});

    describe('moveBackward', () => {});
});
