import { getRepository, In } from 'typeorm';
import Cohort from '@/user/domains/Cohort';

export default function getCohortByName(name: string): Promise<Cohort> {
    return getRepository(Cohort).findOne({ name });
}

export async function removeCohortByName(name: string): Promise<void> {
    await getRepository(Cohort).delete({ name });
}

export async function removeCohortsByNames(names: string[]): Promise<void> {
    await getRepository(Cohort).delete({ name: In(names) });
}

export function createCohort(cohort: Cohort): Promise<Cohort> {
    return getRepository(Cohort).save(cohort);
}
