import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import AuthGuard from '@/common/guards/AuthGuard';
import UserReport from '@/user/domains/UserReport';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';
import SearchResult from '@/common/domains/SearchResult';
import { ApiSecurity } from '@nestjs/swagger';
import ReportRequest from '@/common/domains/ReportRequest';
import AuthToken from '@/common/http/AuthToken';
import Client from '@/common/http/Client';
import ClientType from '@/common/domains/ClientType';
import VersionCode from '@/common/http/VersionCode';
import DeletionService from '@/user/services/DeletionService';
import AuthenticatedUser from '@/common/http/AuthenticatedUser';

@Controller('/v1/users')
@ApiSecurity('Authorization')
export default class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly deletionService: DeletionService,
    ) {}

    @Post()
    createUser(
        @Body() user: User,
        @AuthToken() token: string,
        @Client() client: ClientType,
        @VersionCode() versionCode: number,
    ): Promise<Pick<User, 'username' | 'name' | 'profilePictureUrl'>> {
        return this.userService.createUser(user, token, client, versionCode);
    }

    @Post('/all')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getUsers(@Body() reportRequest: ReportRequest): Promise<SearchResult<UserReport>> {
        return this.userService.getAll();
    }

    @Post('/using-leitner-systems')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getLeitnerLoverUsers(@Body() reportRequest: ReportRequest): Promise<LeitnerSystemsLoverUsersReport[]> {
        return this.userService.getLeitnerLoverUsers();
    }

    @Post('/active-users')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRecentlyActiveUsers(@Body() reportRequest: ReportRequest): Pick<User, 'username'>[] {
        return this.userService.getRecentlyActiveUsers();
    }

    @Delete('/self')
    @UseGuards(AuthGuard)
    async deleteUser(@AuthenticatedUser() user: User): Promise<void> {
        await this.deletionService.deleteData(user.id, user.cohortId);
    }
}
