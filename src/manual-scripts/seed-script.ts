import * as dotenv from 'dotenv';
import InsertVocabularies from './InsertVocabularies';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async function executeSeedScript(): Promise<void> {
    // this won't work with Elastic Beanstalk
    // TODO fix it
    dotenv.config({
        path: './.env',
    });
    await new InsertVocabularies().execute();
    process.exit(0);
})();
