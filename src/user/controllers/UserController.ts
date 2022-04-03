import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';
import UserReport from '@/user/domains/UserReport';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';
import SearchResult from '@/common/domains/SearchResult';
import { ApiSecurity } from '@nestjs/swagger';
import IntruderGuard from '@/common/guards/IntruderGuard';

@Controller('/v1/users')
@ApiSecurity('Authorization')
@UseGuards(IntruderGuard)
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
    getUsers(): Promise<SearchResult<UserReport>> {
        return this.userService.getAll();
    }

    @Get('/using-leitner-systems')
    @UseGuards(AuthGuard)
    getLeitnerLoverUsers(): Promise<LeitnerSystemsLoverUsersReport[]> {
        return this.userService.getLeitnerLoverUsers();
    }
}
