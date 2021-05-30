import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';

@Controller('/v1/users')
export default class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async createUser(@Body() user: User): Promise<User> {
        return this.userService.createUser(user);
    }

    @Get('/:username')
    async getUserByUsername(@Param('username') username: string): Promise<User> {
        return this.userService.getUserByUsername(username);
    }
}
