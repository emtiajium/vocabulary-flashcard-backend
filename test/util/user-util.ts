import User from '@/user/domains/User';
import { getRepository, In } from 'typeorm';

export default function getUserByUsername(username: string): Promise<User> {
    return getRepository(User).findOne({ username });
}

export function getUsersByUsernames(usernames: string[]): Promise<User[]> {
    // as eager is true, no need to pass { relations: ['cohort'] }
    return getRepository(User).find({ where: { username: In(usernames) } });
}

export async function removeUserByUsername(username: string): Promise<void> {
    await getRepository(User).delete({ username });
}

export async function removeUsersByUsernames(usernames: string[]): Promise<void> {
    await getRepository(User).delete({ username: In(usernames) });
}

export function createUser(user: User): Promise<User> {
    return getRepository(User).save(user);
}

export function createApiRequester(): Promise<User> {
    return getRepository(User).save({ username: `requester@request.com`, firstname: 'Requester' });
}
