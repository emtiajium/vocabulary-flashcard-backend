import { Body, Controller, Get, Post } from '@nestjs/common';
import AndroidService from '@/android/services/AndroidService';
import Android from '@/android/domains/Android';

@Controller('/v1/androids')
export default class AndroidController {
    constructor(private readonly androidService: AndroidService) {}

    @Post()
    async fire(@Body() android: Android): Promise<Android> {
        return this.androidService.persist(android);
    }

    @Get()
    async fetch(): Promise<Android> {
        return this.androidService.fetch();
    }
}
