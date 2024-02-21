import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import AutoRunScripts from '@/auto-run-scripts';

kickOff(AppModule)
    .then((app) => {
        // do not need to wait to be resolved/rejected
        new AutoRunScripts(app).runScripts().finally();
    })
    // eslint-disable-next-line unicorn/prefer-top-level-await
    .catch((error) => console.error(`Error bootstrapping the App`, error));
