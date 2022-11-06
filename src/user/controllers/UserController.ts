import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';
import UserReport from '@/user/domains/UserReport';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';
import SearchResult from '@/common/domains/SearchResult';
import { ApiSecurity } from '@nestjs/swagger';
import ReportRequest from '@/common/domains/ReportRequest';

@Controller('/v1/users')
@ApiSecurity('Authorization')
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

    @Post('/all')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    getUsers(@Body() reportRequest: ReportRequest): Promise<SearchResult<UserReport>> {
        return this.userService.getAll(reportRequest.secret);
    }

    @Post('/using-leitner-systems')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    getLeitnerLoverUsers(@Body() reportRequest: ReportRequest): Promise<LeitnerSystemsLoverUsersReport[]> {
        return this.userService.getLeitnerLoverUsers(reportRequest.secret);
    }
}
