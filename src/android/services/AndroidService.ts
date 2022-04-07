import { Injectable, UnauthorizedException } from '@nestjs/common';
import AndroidRepository from '@/android/repositories/AndroidRepository';
import Android from '@/android/domains/Android';
import { ConfigService } from '@nestjs/config';

@Injectable()
export default class AndroidService {
    constructor(private readonly androidRepository: AndroidRepository, private readonly configService: ConfigService) {}

    async persist(android: Android): Promise<Android> {
        if (android.secret !== this.configService.get('ANDROID_VERSION_UPDATE_SECRET')) {
            throw new UnauthorizedException();
        }
        const existingAndroid = await this.fetch();
        return this.androidRepository.save(Android.create(android, existingAndroid?.id));
    }

    fetch(): Promise<Android | undefined> {
        return this.androidRepository.findOne();
    }
}
