import { In } from 'typeorm';
import Cohort from '@/user/domains/Cohort';
import { removeVocabularyAndRelationsByCohortId } from '@test/util/vocabulary-util';
import { removeUsersByCohortIds } from '@test/util/user-util';
import User from '@/user/domains/User';
import DataSource from '@/common/persistence/TypeormConfig';

export default function getCohortByName(name: string): Promise<Cohort> {
    return DataSource.getRepository(Cohort).findOneBy({ name });
}

export async function removeCohortsByNames(names: string[]): Promise<void> {
    await DataSource.getRepository(Cohort).delete({ name: In(names) });
}

export async function removeCohortsByIds(ids: string[]): Promise<void> {
    await DataSource.getRepository(Cohort).delete({ id: In(ids) });
}

export async function removeCohortsWithRelationsByIds(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => removeVocabularyAndRelationsByCohortId(id)));
    await removeUsersByCohortIds(ids);
    await removeCohortsByIds(ids);
}

export async function createCohort(cohort: Cohort): Promise<Cohort> {
    const savedCohort = await DataSource.getRepository(Cohort).save(cohort);
    if (cohort.usernames?.length) {
        await DataSource.getRepository(User).update(
            { username: In(cohort.usernames) },
            { cohort: { id: savedCohort.id } },
        );
    }
    return savedCohort;
}

export async function addUsersToCohort(name: string, usernames: string[]): Promise<void> {
    const cohort = await getCohortByName(name);
    await DataSource.getRepository(User).update({ username: In(usernames) }, { cohort: { id: cohort.id } });
}
