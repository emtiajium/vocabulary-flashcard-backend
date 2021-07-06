import { ConfigService } from '@nestjs/config';
import InsertVocabularies from './InsertVocabularies';

export default async function executeManualScript(): Promise<void> {
    const configService = new ConfigService();
    if (configService.get<boolean>('EXECUTE_MANUAL_SCRIPT')) {
        if (
            configService.get<string>('MANUAL_SCRIPT_NAME') === 'InsertVocabularies' &&
            !configService.get<boolean>('HAS_SCRIPT_INSERT_VOCABULARIES_BEEN_EXECUTED')
        ) {
            await new InsertVocabularies().execute();
        }
    }
}
