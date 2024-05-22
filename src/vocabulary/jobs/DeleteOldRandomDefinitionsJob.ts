import { Injectable } from '@nestjs/common';
import GuessingGameService from '@/vocabulary/services/GuessingGameService';
import { Cron } from '@nestjs/schedule';

const everyOneHour = '0 * * * *';

@Injectable()
export default class DeleteOldRandomDefinitionsJob {
    constructor(private readonly guessingGameService: GuessingGameService) {}

    @Cron(everyOneHour)
    async execute(): Promise<void> {
        await this.guessingGameService.deleteOlder();
    }
}
