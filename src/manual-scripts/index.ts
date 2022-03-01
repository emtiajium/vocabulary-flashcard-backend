import { ConfigService } from '@nestjs/config';
import RemoveDuplicateItemFromLeitnerBox from '@/manual-scripts/RemoveDuplicateItemFromLeitnerBox';
import InsertVocabularies from './InsertVocabularies';

async function executeInsertVocabularies(configService: ConfigService): Promise<void> {
    await (configService.get<string>('MANUAL_SCRIPT_NAME') === 'InsertVocabularies' &&
    configService.get<string>('HAS_SCRIPT_BEEN_EXECUTED') === 'false'
        ? new InsertVocabularies().execute()
        : Promise.resolve());
}

async function executeRemoveDuplicateLeitnerItem(configService: ConfigService): Promise<void> {
    await (configService.get<string>('MANUAL_SCRIPT_NAME') === 'RemoveDuplicateItemFromLeitnerBox' &&
    configService.get<string>('HAS_SCRIPT_BEEN_EXECUTED') === 'false'
        ? new RemoveDuplicateItemFromLeitnerBox().execute()
        : Promise.resolve());
}

export default async function executeManualScript(): Promise<void> {
    const configService = new ConfigService();
    if (configService.get<string>('EXECUTE_MANUAL_SCRIPT') === 'true') {
        await executeInsertVocabularies(configService);
        await executeRemoveDuplicateLeitnerItem(configService);
    }
}
