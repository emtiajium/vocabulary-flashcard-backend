import * as dotenv from 'dotenv';
import InsertVocabularies from './InsertVocabularies';

(async function (): Promise<void> {
    dotenv.config({
        path: './.env',
    });
    await new InsertVocabularies().execute();
    process.exit(0);
})();
