import { Logger, Module } from '@nestjs/common';
import UserController from '@/user/controllers/UserController';
import UserService from '@/user/services/UserService';
import CohortService from '@/user/services/CohortService';
import CohortController from '@/user/controllers/CohortController';
import DatabaseModule from '@/common/persistence/DatabaseModule';

@Module({
    imports: [DatabaseModule],
    controllers: [UserController, CohortController],
    providers: [UserService, CohortService, Logger],
})
export default class UserModule {}
