import { Module } from '@nestjs/common';
import UserModule from '@/user/UserModule';
import { ConfigModule } from '@nestjs/config';
import DatabaseModule from '@/DatabaseModule';

@Module({
    imports: [ConfigModule.forRoot({ envFilePath: '.env' }), DatabaseModule, UserModule],
})
export default class AppModule {}
