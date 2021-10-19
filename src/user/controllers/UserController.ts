import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';

@Controller('/v1/users')
export default class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    createUser(@Body() user: User): Promise<User> {
        return this.userService.createUser(user);
    }

    @Get('/self')
    @UseGuards(AuthGuard)
    getSelfDetails(@AuthenticatedUser() user: User): Promise<User> {
        return this.userService.getUserByUsername(user.username);
    }

    @Get('/all')
    @UseGuards(AuthGuard)
    getUsers(@AuthenticatedUser() user: User): Promise<UserReport[]> {
        return this.userService.getAll();
    }
}
