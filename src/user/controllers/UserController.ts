import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthorizedUser from '@/common/http-decorators/AuthorizedUser';

@Controller('/v1/users')
export default class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async createUser(@Body() user: User): Promise<User> {
        return this.userService.createUser(user);
    }

    @Get('/self')
    @UseGuards(AuthGuard)
    async getSelfDetails(@AuthorizedUser() user: User): Promise<User> {
        return this.userService.getUserByUsername(user.username);
    }
}
