import { getRepository, In } from 'typeorm';
import Cohort from '@/user/domains/Cohort';
import { removeVocabularyAndRelationsByCohortId } from '@test/util/vocabulary-util';
import { removeUsersByCohortIds } from '@test/util/user-util';

export default function getCohortByName(name: string): Promise<Cohort> {
    return getRepository(Cohort).findOne({ name });
}

export async function removeCohortByName(name: string): Promise<void> {
    await getRepository(Cohort).delete({ name });
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

export function createCohort(cohort: Cohort): Promise<Cohort> {
    return getRepository(Cohort).save(cohort);
}
