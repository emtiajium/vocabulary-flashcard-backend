import { Controller, Get } from '@nestjs/common';
import UserService from '@/user/services/UserService';

@Controller('/v1/users')
export default class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    getUsers(): string {
        return this.userService.getUsers();
    }
}
