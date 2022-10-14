import { Module } from '@nestjs/common';
import UserModule from '@/user/UserModule';
import { ConfigModule } from '@nestjs/config';
import DatabaseModule from '@/common/persistence/DatabaseModule';
import AutorunScriptsModule from '@/AutorunScriptsModule';
import VocabularyModule from '@/vocabulary/VocabularyModule';
import AndroidModule from '@/android/AndroidModule';
import HealthCheckModule from '@/health-check/HealthCheckModule';

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: '.env' }),
        DatabaseModule,
        HealthCheckModule,
        AutorunScriptsModule,
        UserModule,
        VocabularyModule,
        AndroidModule,
    ],
})
export default class AppModule {}
