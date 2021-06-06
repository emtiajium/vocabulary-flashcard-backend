import { getRepository } from 'typeorm';
import Cohort from '@/user/domains/Cohort';

export default async function getCohortByName(name: string): Promise<Cohort> {
    return getRepository(Cohort).findOne({ name });
}

export async function removeCohortByName(name: string): Promise<void> {
    await getRepository(Cohort).delete({ name });
}
