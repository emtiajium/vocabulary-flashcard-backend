import { Injectable } from '@nestjs/common';

@Injectable()
export default class UserService {
    getUsers(): string {
        return `Hello, ${this.constructor.name}!`;
    }
}
