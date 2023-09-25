import { Injectable } from '@nestjs/common';
import User from '@/user/domains/User';

const cacheSize = 10;
const cachedUser = new Map<string, User>();

@Injectable()
export default class CacheUserService {
    set(user: User): void {
        if (cachedUser.size >= cacheSize) {
            cachedUser.clear();
        }
        cachedUser.set(user.username, user);
    }

    get(username: string): User {
        return cachedUser.get(username);
    }

    getAll(): User[] {
        const users = [];
        cachedUser.forEach((value) => {
            users.push(value);
        });
        return users;
    }

    delete(username: string): void {
        cachedUser.delete(username);
    }

    deleteMultiples(usernames: string[]): void {
        usernames.forEach((username) => {
            cachedUser.delete(username);
        });
    }
}
