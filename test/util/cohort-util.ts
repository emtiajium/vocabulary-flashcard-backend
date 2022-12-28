import { getRepository, In } from 'typeorm';
import Cohort from '@/user/domains/Cohort';
import { removeVocabularyAndRelationsByCohortId } from '@test/util/vocabulary-util';
import { removeUsersByCohortIds } from '@test/util/user-util';
import User from '@/user/domains/User';

export default function getCohortByName(name: string): Promise<Cohort> {
    return getRepository(Cohort).findOne({ name });
}

export async function removeCohortsByNames(names: string[]): Promise<void> {
    await getRepository(Cohort).delete({ name: In(names) });
}

export async function removeCohortsByIds(ids: string[]): Promise<void> {
    await getRepository(Cohort).delete({ id: In(ids) });
}

export async function removeCohortsWithRelationsByIds(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => removeVocabularyAndRelationsByCohortId(id)));
    await removeUsersByCohortIds(ids);
    await removeCohortsByIds(ids);
}

export async function createCohort(cohort: Cohort): Promise<Cohort> {
    const savedCohort = await getRepository(Cohort).save(cohort);
    if (cohort.usernames?.length) {
        await getRepository(User).update({ username: In(cohort.usernames) }, { cohort: { id: savedCohort.id } });
    }
    return savedCohort;
}

export async function addUsersToCohort(name: string, usernames: string[]): Promise<void> {
    const cohort = await getCohortByName(name);
    await getRepository(User).update({ username: In(usernames) }, { cohort: { id: cohort.id } });
}
