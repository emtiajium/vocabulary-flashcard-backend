import { Module } from '@nestjs/common';
import UserController from '@/user/controllers/UserController';
import UserService from '@/user/services/UserService';
import { TypeOrmModule } from '@nestjs/typeorm';
import UserRepository from '@/user/repositories/UserRepository';

@Module({
    imports: [TypeOrmModule.forFeature([UserRepository])],
    controllers: [UserController],
    providers: [UserService],
    exports: [TypeOrmModule],
})
export default class UserModule {}
