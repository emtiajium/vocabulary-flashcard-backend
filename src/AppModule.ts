import { Module } from '@nestjs/common';
import UserModule from '@/user/UserModule';
import { ConfigModule } from '@nestjs/config';
import DatabaseModule from '@/DatabaseModule';
import AutorunScriptsModule from '@/AutorunScriptsModule';
import VocabularyModule from '@/vocabulary/VocabularyModule';
import AndroidModule from '@/android/AndroidModule';

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: '.env' }),
        DatabaseModule,
        UserModule,
        AutorunScriptsModule,
        VocabularyModule,
        AndroidModule,
    ],
})
export default class AppModule {}
