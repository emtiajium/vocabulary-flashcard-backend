import User from '@/user/domains/User';
import { getRepository, In } from 'typeorm';
import * as uuid from 'uuid';

export default function getUserByUsername(username: string): Promise<User> {
    return getRepository(User).findOne({ username });
}

export function generateUsername(): string {
    return `example+${uuid.v4()}@firecrackervocabulary.com`;
}

export function getUsersByUsernames(usernames: string[]): Promise<User[]> {
    // as eager is true, no need to pass { relations: ['cohort'] }
    return getRepository(User).find({ where: { username: In(usernames) } });
}

export async function removeUsersByUsernames(usernames: string[]): Promise<void> {
    await getRepository(User).delete({ username: In(usernames) });
}

export async function removeUsersByCohortIds(cohortIds: string[]): Promise<void> {
    await getRepository(User).delete({ cohort: { id: In(cohortIds) } });
}

export async function resetCohortById(id: string): Promise<void> {
    await getRepository(User).update({ id }, { cohort: { id: null } });
}

export async function updateCohortById(id: string, cohortId: string): Promise<void> {
    await getRepository(User).update(id, { cohort: { id: cohortId } });
}

export function createUser(user: User): Promise<User> {
    return getRepository(User).save(user);
}

export function createApiRequester(username?: string): Promise<User> {
    return createUser({ username: username || generateUsername(), firstname: 'Requester' } as User);
}
