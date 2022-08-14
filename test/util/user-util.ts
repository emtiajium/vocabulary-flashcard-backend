import User from '@/user/domains/User';
import { getRepository, In } from 'typeorm';
import * as uuid from 'uuid';

export default function getUserByUsername(username: string): Promise<User> {
    return getRepository(User).findOne({ username });
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

export function createUser(user: User): Promise<User> {
    return getRepository(User).save(user);
}

export function createApiRequester(): Promise<User> {
    return createUser({ username: `requester+${uuid.v4()}@request.com`, firstname: 'Requester' } as User);
}
