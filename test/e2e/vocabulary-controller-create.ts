import { INestApplication } from '@nestjs/common';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import getAppAPIPrefix from '@test/util/service-util';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import Meaning from '@/vocabulary/domains/Meaning';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';

describe('/v1/vocabularies', () => {
    let app: INestApplication;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await bootstrap(AppModule);
        await removeCohortByName('Vocabulary Automated Test Cohort');
        cohort = await createCohort({ name: 'Vocabulary Automated Test Cohort', userIds: [] } as Cohort);
    });

    afterAll(async () => {
        await app.close();
        await removeCohortByName(cohort.name);
    });

    async function makeApiRequest(vocabulary?: Vocabulary): Promise<SupertestResponse<void>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/vocabularies`)
            .send(vocabulary);
        console.log('body', body);
        return {
            status,
            body,
        };
    }

    function getBaseMeaningPayloadWithoutRelations(): Meaning {
        const meaning = new Meaning();
        meaning.meaning = 'Meaning';
        meaning.examples = ['Example1'];
        meaning.notes = ['Notes1'];
        meaning.externalLinks = ['ExternalLinks1'];
        return meaning;
    }

    describe('POST /', () => {
        describe('Bad Payload', () => {
            it('SHOULD return 400 BAD_REQUEST for empty payload', async () => {
                const { status } = await makeApiRequest();
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without cohort', async () => {
                const payload = new Vocabulary();
                payload.isDraft = true;
                payload.cohortId = null;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without isDraft', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without meanings', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.meanings = null;
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload WHEN meanings is an empty array', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                payload.meanings = [];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without meanings[X].meaning', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                const meaning = getBaseMeaningPayloadWithoutRelations();
                delete meaning.meaning;
                payload.meanings = [meaning];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without meanings[X].examples', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                const meaning = { ...getBaseMeaningPayloadWithoutRelations() } as ObjectLiteral;
                delete meaning.examples;
                payload.meanings = [meaning as Meaning];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with empty meanings[X].examples', async () => {
                const payload = new Vocabulary();
                payload.cohortId = cohort.id;
                payload.isDraft = false;
                const meaning = { ...getBaseMeaningPayloadWithoutRelations(), examples: [] };
                payload.meanings = [meaning as Meaning];
                const { status } = await makeApiRequest(payload);
                expect(status).toBe(400);
            });
        });
    });
});
