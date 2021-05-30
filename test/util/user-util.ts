import User from '@/user/domains/User';
import { getRepository } from 'typeorm';

export default async function getUserByUsername(username: string): Promise<User> {
    return getRepository(User).findOne({ username });
}

export async function removeUserByUsername(username: string): Promise<void> {
    await getRepository(User).delete({ username });
}

export async function createUser(user: User): Promise<User> {
    return getRepository(User).save(user);
}
