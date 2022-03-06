import { Body, Controller, Get, Post } from '@nestjs/common';
import AndroidService from '@/android/services/AndroidService';
import Android from '@/android/domains/Android';
import { ApiSecurity } from '@nestjs/swagger';

@Controller('/v1/androids')
@ApiSecurity('Authorization')
export default class AndroidController {
    constructor(private readonly androidService: AndroidService) {}

    @Post()
    fire(@Body() android: Android): Promise<Android> {
        return this.androidService.persist(android);
    }

    @Get()
    fetch(): Promise<Android> {
        return this.androidService.fetch();
    }
}
