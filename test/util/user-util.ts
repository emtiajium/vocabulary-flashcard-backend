import User from '@/user/domains/User';
import { In } from 'typeorm';
import * as uuid from 'uuid';
import DataSource from '@/common/persistence/TypeormConfig';

export default function getUserByUsername(username: string): Promise<User> {
    return DataSource.getRepository(User).findOneBy({ username });
}

export function generateUsername(): string {
    return `example+${uuid.v4()}@firecrackervocabulary.com`;
}

export function getUsersByUsernames(usernames: string[]): Promise<User[]> {
    return DataSource.getRepository(User).find({ where: { username: In(usernames) }, relations: ['cohort'] });
}

export async function removeUsersByUsernames(usernames: string[]): Promise<void> {
    await DataSource.getRepository(User).delete({ username: In(usernames) });
}

export async function removeUsersByCohortIds(cohortIds: string[]): Promise<void> {
    await DataSource.getRepository(User).delete({ cohort: { id: In(cohortIds) } });
}

export async function resetCohortById(id: string): Promise<void> {
    await DataSource.query(
        `UPDATE "User"
         SET "cohortId" = NULL
         WHERE id = $1`,
        [id],
    );
}

export async function updateCohortById(id: string, cohortId: string): Promise<void> {
    await DataSource.getRepository(User).update(id, { cohort: { id: cohortId } });
}

export function createUser(user: User): Promise<User> {
    return DataSource.getRepository(User).save(user);
}

export function createApiRequester(username?: string): Promise<User> {
    return createUser({ username: username || generateUsername(), firstname: 'Requester' } as User);
}
