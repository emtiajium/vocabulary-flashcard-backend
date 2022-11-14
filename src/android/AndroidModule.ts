import { Logger, Module } from '@nestjs/common';
import AndroidController from '@/android/controllers/AndroidController';
import AndroidService from '@/android/services/AndroidService';
import { ConfigService } from '@nestjs/config';
import DatabaseModule from '@/common/persistence/DatabaseModule';
import TokenManager from '@/common/services/TokenManager';

@Module({
    imports: [DatabaseModule],
    controllers: [AndroidController],
    providers: [AndroidService, ConfigService, TokenManager, Logger],
})
export default class AndroidModule {}
