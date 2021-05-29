import { Body, Controller, Post } from '@nestjs/common';
import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';

@Controller('/v1/users')
export default class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async createUser(@Body() user: User): Promise<void> {
        await this.userService.createUser(user);
    }
}
