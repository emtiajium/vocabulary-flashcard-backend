import { ConfigService } from '@nestjs/config';
import InsertVocabularies from './InsertVocabularies';

export default async function executeManualScript(): Promise<void> {
    const configService = new ConfigService();
    if (configService.get<string>('EXECUTE_MANUAL_SCRIPT') === 'true') {
        await (configService.get<string>('MANUAL_SCRIPT_NAME') === 'InsertVocabularies' &&
        configService.get<string>('HAS_SCRIPT_INSERT_VOCABULARIES_BEEN_EXECUTED') === 'false'
            ? new InsertVocabularies().execute()
            : Promise.resolve());
    }
}
