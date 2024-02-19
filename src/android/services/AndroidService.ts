import { Injectable } from '@nestjs/common';
import AndroidRepository from '@/android/repositories/AndroidRepository';
import Android from '@/android/domains/Android';

@Injectable()
export default class AndroidService {
    constructor(private readonly androidRepository: AndroidRepository) {}

    async persist(android: Android): Promise<Android> {
        const existingAndroid = await this.fetch();
        return this.androidRepository.save(Android.create(android, existingAndroid?.id));
    }

    fetch(): Promise<Android | undefined> {
        return this.androidRepository.findOneBy({});
    }
}
