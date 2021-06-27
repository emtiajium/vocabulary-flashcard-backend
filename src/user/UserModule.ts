import { Module } from '@nestjs/common';
import UserController from '@/user/controllers/UserController';
import UserService from '@/user/services/UserService';
import CohortService from '@/user/services/CohortService';
import CohortController from '@/user/controllers/CohortController';

@Module({
    controllers: [UserController, CohortController],
    providers: [UserService, CohortService],
})
export default class UserModule {}
