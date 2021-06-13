import { Module } from '@nestjs/common';
import UserModule from '@/user/UserModule';
import { ConfigModule } from '@nestjs/config';
import DatabaseModule from '@/DatabaseModule';
import AutorunScriptsModule from '@/AutorunScriptsModule';

@Module({
    imports: [ConfigModule.forRoot({ envFilePath: '.env' }), DatabaseModule, UserModule, AutorunScriptsModule],
})
export default class AppModule {}
