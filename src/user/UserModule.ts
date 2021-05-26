import { Module } from '@nestjs/common';
import UserController from '@/user/controllers/UserController';
import UserService from '@/user/services/UserService';

@Module({
    controllers: [UserController],
    providers: [UserService],
})
export default class UserModule {}
