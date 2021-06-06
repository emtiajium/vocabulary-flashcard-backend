import User from '@/user/domains/User';
import { getRepository, In } from 'typeorm';

export default async function getUserByUsername(username: string): Promise<User> {
    return getRepository(User).findOne({ username });
}

export async function getUsersByUsernames(usernames: string[]): Promise<User[]> {
    return getRepository(User).find({ username: In(usernames) });
}

export async function removeUserByUsername(username: string): Promise<void> {
    await getRepository(User).delete({ username });
}

export async function removeUsersByUsernames(usernames: string[]): Promise<void> {
    await getRepository(User).delete({ username: In(usernames) });
}

export async function createUser(user: User): Promise<User> {
    return getRepository(User).save(user);
}
