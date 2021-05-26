import { Module } from '@nestjs/common';
import UserModule from '@/user/UserModule';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule.forRoot({ envFilePath: '.env' }), UserModule],
})
export default class AppModule {}
