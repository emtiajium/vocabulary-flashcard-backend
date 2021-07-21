import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import AndroidRepository from '@/android/repositories/AndroidRepository';
import AndroidController from '@/android/controllers/AndroidController';
import AndroidService from '@/android/services/AndroidService';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [TypeOrmModule.forFeature([AndroidRepository])],
    controllers: [AndroidController],
    providers: [AndroidService, ConfigService],
})
export default class AndroidModule {}
