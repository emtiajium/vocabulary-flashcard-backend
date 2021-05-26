import { Module } from '@nestjs/common';
import UserModule from '@/user/UserModule';

@Module({
    imports: [UserModule],
})
export default class AppModule {}
