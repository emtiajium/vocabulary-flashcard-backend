import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import AuthGuard from '@/common/guards/AuthGuard';
import UserReport from '@/user/domains/UserReport';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';
import SearchResult from '@/common/domains/SearchResult';
import { ApiSecurity } from '@nestjs/swagger';
import ReportRequest from '@/common/domains/ReportRequest';
import DeletionService from '@/user/services/DeletionService';
import AuthenticatedUser from '@/common/http/AuthenticatedUser';
import { AuthCookieService } from '@/user/services/AuthCookieService';
import { AuthSessionService } from '@/user/services/AuthSessionService';

@Controller('/v1/users')
@ApiSecurity('Authorization')
export default class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly deletionService: DeletionService,
        private readonly authSessionService: AuthSessionService,
        private readonly authCookieService: AuthCookieService,
    ) {}

    @Post()
    async createUser(
        @Body('idToken') idToken: string,
        @Res({ passthrough: true }) response: Response,
    ): Promise<Pick<User, 'username' | 'name' | 'profilePictureUrl'>> {
        const userResponse = await this.userService.createUser(idToken);
        const tokens = await this.authSessionService.create(userResponse.id, userResponse.username);
        this.authCookieService.set(response, tokens.accessToken, tokens.refreshToken);
        return userResponse;
    }

    @Post('/all')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    getUsers(@Body() reportRequest: ReportRequest): Promise<SearchResult<UserReport>> {
        void reportRequest;
        return this.userService.getAll();
    }

    @Post('/using-leitner-systems')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    getLeitnerLoverUsers(@Body() reportRequest: ReportRequest): Promise<LeitnerSystemsLoverUsersReport[]> {
        void reportRequest;
        return this.userService.getLeitnerLoverUsers();
    }

    @Post('/active-users')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    getRecentlyActiveUsers(@Body() reportRequest: ReportRequest): Pick<User, 'username'>[] {
        void reportRequest;
        return this.userService.getRecentlyActiveUsers();
    }

    @Delete('/self')
    @UseGuards(AuthGuard)
    async deleteUser(@AuthenticatedUser() user: User): Promise<void> {
        await this.deletionService.deleteData(user.id, user.cohortId);
    }
}
