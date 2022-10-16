import { Module } from '@nestjs/common';
import AndroidController from '@/android/controllers/AndroidController';
import AndroidService from '@/android/services/AndroidService';
import { ConfigService } from '@nestjs/config';
import DatabaseModule from '@/common/persistence/DatabaseModule';

@Module({
    imports: [DatabaseModule],
    controllers: [AndroidController],
    providers: [AndroidService, ConfigService],
})
export default class AndroidModule {}
