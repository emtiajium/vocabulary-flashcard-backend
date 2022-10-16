import { Module } from '@nestjs/common';
import UserModule from '@/user/UserModule';
import { ConfigModule } from '@nestjs/config';
import AutorunScriptsModule from '@/AutorunScriptsModule';
import VocabularyModule from '@/vocabulary/VocabularyModule';
import AndroidModule from '@/android/AndroidModule';
import HealthCheckModule from '@/health-check/HealthCheckModule';

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: '.env' }),
        HealthCheckModule,
        AutorunScriptsModule,
        UserModule,
        VocabularyModule,
        AndroidModule,
    ],
})
export default class AppModule {}
